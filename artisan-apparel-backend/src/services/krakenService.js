/**
 * Kraken Exchange Service
 * =======================
 * Integration with Kraken API for crypto-to-USD conversion.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const KrakenClient = require('kraken-api');
const config = require('../config/env');
const logger = require('../utils/logger');
const { CryptoRate } = require('../models');

class KrakenService {
  constructor() {
    this.apiKey = config.kraken.apiKey;
    this.apiSecret = config.kraken.apiSecret;
    this.withdrawalKey = config.kraken.withdrawalKey;
    
    // Initialize Kraken client if credentials are available
    if (this.apiKey && this.apiSecret) {
      this.client = new KrakenClient(this.apiKey, this.apiSecret);
    }
    
    // Kraken pair names mapping
    this.pairMap = {
      DCR: 'DCRUSD',
      BTC: 'XXBTZUSD',
      XMR: 'XXMRZUSD',
      ETH: 'XETHZUSD',
      LTC: 'XLTCZUSD',
    };
    
    // Asset name mapping
    this.assetMap = {
      DCR: 'DCR',
      BTC: 'XXBT',
      XMR: 'XXMR',
      ETH: 'XETH',
      LTC: 'XLTC',
    };
  }
  
  /**
   * Check if Kraken is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.apiKey && this.apiSecret && this.client);
  }
  
  /**
   * Get current price for a cryptocurrency
   * @param {string} cryptocurrency - Currency code (DCR, BTC, etc.)
   * @returns {Promise<number>} Current USD price
   */
  async getCurrentPrice(cryptocurrency) {
    try {
      const pair = this.pairMap[cryptocurrency.toUpperCase()];
      if (!pair) {
        throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
      }
      
      // Check cache first
      const cached = await CryptoRate.getLatestRate(
        cryptocurrency,
        config.payment.rateCacheSeconds
      );
      
      if (cached) {
        return parseFloat(cached.usd_rate);
      }
      
      // Fetch from Kraken
      const ticker = await this.client.api('Ticker', { pair });
      const pairData = ticker.result[pair] || ticker.result[Object.keys(ticker.result)[0]];
      
      if (!pairData) {
        throw new Error(`No price data for ${cryptocurrency}`);
      }
      
      const price = parseFloat(pairData.c[0]); // Current price
      const volume = parseFloat(pairData.v[1]); // 24h volume
      const change = ((parseFloat(pairData.c[0]) - parseFloat(pairData.o)) / parseFloat(pairData.o)) * 100;
      
      // Cache the rate
      await CryptoRate.saveRate(cryptocurrency, price, 'kraken');
      
      logger.info('Fetched crypto price from Kraken', {
        cryptocurrency,
        price,
        volume,
        change24h: change.toFixed(2) + '%',
      });
      
      return price;
    } catch (error) {
      logger.error('Failed to get price from Kraken', {
        cryptocurrency,
        error: error.message,
      });
      
      // Try to return last known rate
      const lastRate = await CryptoRate.getLatestRate(cryptocurrency, 3600); // 1 hour max
      if (lastRate) {
        logger.warn('Using stale rate', { cryptocurrency, age: 'up to 1 hour' });
        return parseFloat(lastRate.usd_rate);
      }
      
      throw error;
    }
  }
  
  /**
   * Get account balances
   * @returns {Promise<Object>} Balances by currency
   */
  async getBalances() {
    if (!this.isConfigured()) {
      throw new Error('Kraken API not configured');
    }
    
    try {
      const balance = await this.client.api('Balance');
      
      const balances = {};
      for (const [asset, amount] of Object.entries(balance.result)) {
        const value = parseFloat(amount);
        if (value > 0) {
          // Map Kraken asset names back to standard codes
          let code = asset;
          for (const [standard, kraken] of Object.entries(this.assetMap)) {
            if (kraken === asset) {
              code = standard;
              break;
            }
          }
          balances[code] = value;
        }
      }
      
      logger.info('Retrieved Kraken balances', { balanceCount: Object.keys(balances).length });
      return balances;
    } catch (error) {
      logger.error('Failed to get Kraken balances', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Convert cryptocurrency to USD
   * @param {string} cryptocurrency - Currency to sell
   * @param {number} amount - Amount to sell
   * @returns {Promise<Object>} Order result
   */
  async convertToUSD(cryptocurrency, amount) {
    if (!this.isConfigured()) {
      throw new Error('Kraken API not configured');
    }
    
    try {
      const pair = this.pairMap[cryptocurrency.toUpperCase()];
      if (!pair) {
        throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
      }
      
      // Place a market sell order
      const order = await this.client.api('AddOrder', {
        pair,
        type: 'sell',
        ordertype: 'market',
        volume: amount.toString(),
        validate: false, // Set to true for testing
      });
      
      logger.logPayment('kraken_sell_order', {
        cryptocurrency,
        amount,
        txids: order.result.txid,
        description: order.result.descr,
      });
      
      return {
        success: true,
        txIds: order.result.txid,
        description: order.result.descr,
      };
    } catch (error) {
      logger.error('Failed to convert crypto on Kraken', {
        cryptocurrency,
        amount,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Withdraw USD to bank account
   * @param {number} amount - Amount to withdraw (or 'all')
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawToBank(amount = 'all') {
    if (!this.isConfigured()) {
      throw new Error('Kraken API not configured');
    }
    
    if (!this.withdrawalKey) {
      throw new Error('Bank withdrawal key not configured');
    }
    
    try {
      let withdrawAmount = amount;
      
      if (amount === 'all') {
        const balances = await this.getBalances();
        withdrawAmount = balances['ZUSD'] || balances['USD'] || 0;
        
        if (withdrawAmount <= 0) {
          logger.info('No USD balance to withdraw');
          return { success: false, reason: 'No USD balance' };
        }
      }
      
      const withdrawal = await this.client.api('Withdraw', {
        asset: 'ZUSD',
        key: this.withdrawalKey,
        amount: withdrawAmount.toString(),
      });
      
      logger.logPayment('kraken_bank_withdrawal', {
        amount: withdrawAmount,
        refId: withdrawal.result.refid,
      });
      
      return {
        success: true,
        refId: withdrawal.result.refid,
        amount: withdrawAmount,
      };
    } catch (error) {
      logger.error('Failed to withdraw to bank', {
        amount,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get deposit address for a cryptocurrency
   * @param {string} cryptocurrency - Currency code
   * @returns {Promise<string>} Deposit address
   */
  async getDepositAddress(cryptocurrency) {
    if (!this.isConfigured()) {
      throw new Error('Kraken API not configured');
    }
    
    try {
      const asset = this.assetMap[cryptocurrency.toUpperCase()];
      if (!asset) {
        throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
      }
      
      const result = await this.client.api('DepositAddresses', {
        asset,
        method: cryptocurrency === 'BTC' ? 'Bitcoin' : cryptocurrency,
      });
      
      if (result.result && result.result.length > 0) {
        return result.result[0].address;
      }
      
      throw new Error('No deposit address available');
    } catch (error) {
      logger.error('Failed to get deposit address', {
        cryptocurrency,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get recent trades/orders
   * @param {number} limit - Number of trades to fetch
   * @returns {Promise<Array>} Recent trades
   */
  async getRecentTrades(limit = 50) {
    if (!this.isConfigured()) {
      throw new Error('Kraken API not configured');
    }
    
    try {
      const result = await this.client.api('TradesHistory', {
        trades: true,
      });
      
      const trades = Object.entries(result.result.trades || {})
        .map(([id, trade]) => ({
          id,
          pair: trade.pair,
          type: trade.type,
          orderType: trade.ordertype,
          price: parseFloat(trade.price),
          volume: parseFloat(trade.vol),
          cost: parseFloat(trade.cost),
          fee: parseFloat(trade.fee),
          time: new Date(trade.time * 1000),
        }))
        .slice(0, limit);
      
      return trades;
    } catch (error) {
      logger.error('Failed to get recent trades', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Perform weekly crypto-to-USD conversion
   * Called by scheduled job
   * @param {number} minUSDThreshold - Minimum USD value to convert
   * @returns {Promise<Object>} Conversion results
   */
  async weeklyConversion(minUSDThreshold = 100) {
    if (!this.isConfigured()) {
      logger.warn('Kraken not configured, skipping weekly conversion');
      return { success: false, reason: 'Not configured' };
    }
    
    try {
      const balances = await this.getBalances();
      const results = {
        conversions: [],
        totalUSD: 0,
        errors: [],
      };
      
      // Convert each crypto balance to USD
      for (const [crypto, balance] of Object.entries(balances)) {
        if (['USD', 'ZUSD'].includes(crypto)) continue; // Skip USD
        if (!this.pairMap[crypto]) continue; // Skip unsupported
        
        try {
          const price = await this.getCurrentPrice(crypto);
          const usdValue = balance * price;
          
          if (usdValue >= minUSDThreshold) {
            const result = await this.convertToUSD(crypto, balance);
            results.conversions.push({
              crypto,
              amount: balance,
              usdValue,
              ...result,
            });
            results.totalUSD += usdValue;
          } else {
            logger.info('Skipping conversion below threshold', {
              crypto,
              balance,
              usdValue,
              threshold: minUSDThreshold,
            });
          }
        } catch (error) {
          results.errors.push({ crypto, error: error.message });
        }
      }
      
      logger.info('Weekly conversion complete', {
        conversions: results.conversions.length,
        totalUSD: results.totalUSD,
        errors: results.errors.length,
      });
      
      return results;
    } catch (error) {
      logger.error('Weekly conversion failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new KrakenService();
