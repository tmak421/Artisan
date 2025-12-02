/**
 * Decred Payment Service
 * ======================
 * Integration with dcrwallet RPC for Decred payments.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { formatCryptoAmount, hashForLogging } = require('../utils/crypto');

class DecredService {
  constructor() {
    this.rpcUrl = config.decred.rpcUrl;
    this.auth = Buffer.from(
      `${config.decred.rpcUser}:${config.decred.rpcPassword}`
    ).toString('base64');
    this.minConfirmations = config.decred.minConfirmations;
    
    // Track monitored addresses
    this.monitoredAddresses = new Map();
  }
  
  /**
   * Make an RPC call to dcrwallet
   * @param {string} method - RPC method name
   * @param {Array} params - Method parameters
   * @returns {Promise<any>} RPC result
   */
  async rpcCall(method, params = []) {
    try {
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '1.0',
          id: `dcr-${Date.now()}`,
          method,
          params,
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );
      
      if (response.data.error) {
        throw new Error(response.data.error.message || 'RPC Error');
      }
      
      return response.data.result;
    } catch (error) {
      logger.error('Decred RPC call failed', {
        method,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Generate a new payment address for an order
   * @param {string} orderId - Order identifier for labeling
   * @returns {Promise<string>} New Decred address
   */
  async generateAddress(orderId) {
    try {
      // Use order ID as account/label for tracking
      const address = await this.rpcCall('getnewaddress', [`order_${orderId}`]);
      
      logger.logPayment('address_generated', {
        orderId,
        address: hashForLogging(address),
        cryptocurrency: 'DCR',
      });
      
      return address;
    } catch (error) {
      logger.error('Failed to generate Decred address', {
        orderId,
        error: error.message,
      });
      throw new Error('Failed to generate payment address');
    }
  }
  
  /**
   * Check if an address has received payment
   * @param {string} address - Payment address
   * @param {number} expectedAmount - Expected payment amount
   * @returns {Promise<Object>} Payment status
   */
  async checkPayment(address, expectedAmount) {
    try {
      // Get received amount with minimum confirmations
      const received = await this.rpcCall('getreceivedbyaddress', [
        address,
        this.minConfirmations,
      ]);
      
      // Get unconfirmed balance as well
      const unconfirmed = await this.rpcCall('getreceivedbyaddress', [address, 0]);
      
      const receivedAmount = parseFloat(received) || 0;
      const unconfirmedAmount = parseFloat(unconfirmed) || 0;
      const pendingAmount = unconfirmedAmount - receivedAmount;
      
      return {
        received: receivedAmount,
        pending: pendingAmount,
        total: unconfirmedAmount,
        expected: expectedAmount,
        isComplete: receivedAmount >= expectedAmount,
        isPending: pendingAmount > 0,
        isUnderpaid: unconfirmedAmount > 0 && unconfirmedAmount < expectedAmount,
      };
    } catch (error) {
      logger.error('Failed to check Decred payment', {
        address: hashForLogging(address),
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get transaction details
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.rpcCall('gettransaction', [txHash]);
      
      return {
        hash: txHash,
        amount: Math.abs(tx.amount),
        fee: tx.fee || 0,
        confirmations: tx.confirmations,
        blockHash: tx.blockhash,
        blockTime: tx.blocktime ? new Date(tx.blocktime * 1000) : null,
        details: tx.details,
      };
    } catch (error) {
      logger.error('Failed to get Decred transaction', {
        txHash: hashForLogging(txHash),
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * List transactions for an address/account
   * @param {string} orderId - Order ID (used as account label)
   * @param {number} count - Number of transactions to fetch
   * @returns {Promise<Array>} Transaction list
   */
  async listTransactions(orderId, count = 10) {
    try {
      const transactions = await this.rpcCall('listtransactions', [
        `order_${orderId}`,
        count,
      ]);
      
      return transactions.map(tx => ({
        hash: tx.txid,
        amount: tx.amount,
        confirmations: tx.confirmations,
        category: tx.category, // 'receive', 'send', etc.
        time: new Date(tx.time * 1000),
        address: tx.address,
      }));
    } catch (error) {
      logger.error('Failed to list Decred transactions', {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get wallet balance
   * @returns {Promise<Object>} Wallet balances
   */
  async getBalance() {
    try {
      const balance = await this.rpcCall('getbalance');
      const unconfirmed = await this.rpcCall('getunconfirmedbalance');
      
      return {
        confirmed: parseFloat(balance) || 0,
        unconfirmed: parseFloat(unconfirmed) || 0,
        total: (parseFloat(balance) || 0) + (parseFloat(unconfirmed) || 0),
      };
    } catch (error) {
      logger.error('Failed to get Decred balance', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Send DCR to an address (for refunds)
   * @param {string} toAddress - Destination address
   * @param {number} amount - Amount to send
   * @returns {Promise<string>} Transaction hash
   */
  async sendPayment(toAddress, amount) {
    try {
      const txHash = await this.rpcCall('sendtoaddress', [
        toAddress,
        formatCryptoAmount(amount, 'DCR'),
      ]);
      
      logger.logPayment('dcr_sent', {
        toAddress: hashForLogging(toAddress),
        amount,
        txHash: hashForLogging(txHash),
      });
      
      return txHash;
    } catch (error) {
      logger.error('Failed to send Decred payment', {
        toAddress: hashForLogging(toAddress),
        amount,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Start monitoring an address for incoming payments
   * @param {string} address - Address to monitor
   * @param {number} expectedAmount - Expected payment amount
   * @param {string} orderId - Order ID for reference
   * @param {Function} callback - Callback function(orderId, paymentData)
   * @param {number} timeoutMinutes - Monitoring timeout
   */
  startMonitoring(address, expectedAmount, orderId, callback, timeoutMinutes = 60) {
    // Clear any existing monitor for this order
    this.stopMonitoring(orderId);
    
    const checkInterval = setInterval(async () => {
      try {
        const status = await this.checkPayment(address, expectedAmount);
        
        if (status.isComplete) {
          // Payment confirmed with required confirmations
          this.stopMonitoring(orderId);
          
          // Get transaction details
          const transactions = await this.listTransactions(orderId, 1);
          const tx = transactions.find(t => t.category === 'receive') || {};
          
          callback(orderId, {
            status: 'confirmed',
            received: status.received,
            txHash: tx.hash,
            confirmations: tx.confirmations || this.minConfirmations,
          });
        } else if (status.isPending) {
          // Payment detected but not yet confirmed
          callback(orderId, {
            status: 'confirming',
            received: status.total,
            pending: status.pending,
          });
        }
      } catch (error) {
        logger.error('Payment monitoring error', {
          orderId,
          address: hashForLogging(address),
          error: error.message,
        });
      }
    }, 30000); // Check every 30 seconds
    
    // Set timeout
    const timeout = setTimeout(() => {
      this.stopMonitoring(orderId);
      callback(orderId, { status: 'expired' });
    }, timeoutMinutes * 60 * 1000);
    
    // Store references
    this.monitoredAddresses.set(orderId, { checkInterval, timeout });
    
    logger.logPayment('monitoring_started', {
      orderId,
      address: hashForLogging(address),
      expectedAmount,
      timeoutMinutes,
    });
  }
  
  /**
   * Stop monitoring an address
   * @param {string} orderId - Order ID
   */
  stopMonitoring(orderId) {
    const monitor = this.monitoredAddresses.get(orderId);
    if (monitor) {
      clearInterval(monitor.checkInterval);
      clearTimeout(monitor.timeout);
      this.monitoredAddresses.delete(orderId);
      
      logger.logPayment('monitoring_stopped', { orderId });
    }
  }
  
  /**
   * Validate a Decred address
   * @param {string} address - Address to validate
   * @returns {Promise<boolean>} Whether address is valid
   */
  async validateAddress(address) {
    try {
      const result = await this.rpcCall('validateaddress', [address]);
      return result.isvalid === true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Estimate transaction fee
   * @param {number} blocks - Target confirmation blocks
   * @returns {Promise<number>} Fee per KB
   */
  async estimateFee(blocks = 2) {
    try {
      const fee = await this.rpcCall('estimatefee', [blocks]);
      return fee > 0 ? fee : 0.0001; // Default minimum fee
    } catch (error) {
      return 0.0001;
    }
  }
}

// Export singleton instance
module.exports = new DecredService();
