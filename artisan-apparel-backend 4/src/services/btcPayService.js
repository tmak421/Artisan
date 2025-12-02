/**
 * BTCPay Server Service
 * =====================
 * Integration with BTCPay Server for Bitcoin payments.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { hashForLogging } = require('../utils/crypto');

class BTCPayService {
  constructor() {
    this.apiUrl = config.btcpay.url;
    this.apiKey = config.btcpay.apiKey;
    this.storeId = config.btcpay.storeId;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }
  
  /**
   * Check if BTCPay is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.apiUrl && this.apiKey && this.storeId);
  }
  
  /**
   * Create a new invoice for payment
   * @param {string} orderId - Order identifier
   * @param {number} amountUSD - Amount in USD
   * @param {string} customerEmail - Customer email
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Invoice details
   */
  async createInvoice(orderId, amountUSD, customerEmail, metadata = {}) {
    try {
      const response = await this.client.post(
        `/api/v1/stores/${this.storeId}/invoices`,
        {
          amount: amountUSD.toString(),
          currency: 'USD',
          metadata: {
            orderId,
            ...metadata,
          },
          checkout: {
            speedPolicy: 'HighSpeed', // 0 confirmations for small amounts
            paymentMethods: ['BTC', 'BTC-LightningNetwork'],
            expirationMinutes: config.payment.expiryMinutes,
            monitoringMinutes: 1440, // Monitor for 24 hours
            redirectURL: `${config.urls.orderSuccess}?order=${orderId}`,
            redirectAutomatically: true,
          },
          receipt: {
            enabled: true,
            showQR: true,
          },
          buyer: {
            email: customerEmail,
          },
          notificationUrl: `${config.urls.frontend}/api/webhooks/btcpay`,
        }
      );
      
      const invoice = response.data;
      
      // Extract payment methods
      const paymentMethods = await this.getInvoicePaymentMethods(invoice.id);
      
      logger.logPayment('btcpay_invoice_created', {
        orderId,
        invoiceId: invoice.id,
        amountUSD,
      });
      
      return {
        invoiceId: invoice.id,
        status: invoice.status,
        checkoutLink: invoice.checkoutLink,
        expiresAt: new Date(invoice.expirationTime * 1000),
        paymentMethods,
        metadata: invoice.metadata,
      };
    } catch (error) {
      logger.error('Failed to create BTCPay invoice', {
        orderId,
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to create Bitcoin payment invoice');
    }
  }
  
  /**
   * Get payment methods for an invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Payment methods
   */
  async getInvoicePaymentMethods(invoiceId) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}/payment-methods`
      );
      
      return response.data.map(pm => ({
        method: pm.paymentMethod,
        destination: pm.destination, // Address or Lightning invoice
        amount: pm.due,
        rate: pm.rate,
        networkFee: pm.networkFee,
      }));
    } catch (error) {
      logger.error('Failed to get BTCPay payment methods', {
        invoiceId,
        error: error.message,
      });
      return [];
    }
  }
  
  /**
   * Get invoice status
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice status
   */
  async getInvoiceStatus(invoiceId) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}`
      );
      
      const invoice = response.data;
      
      return {
        invoiceId: invoice.id,
        status: this.mapStatus(invoice.status),
        additionalStatus: invoice.additionalStatus,
        amount: invoice.amount,
        currency: invoice.currency,
        received: invoice.additionalStatus === 'Paid' ? invoice.amount : 0,
        expiresAt: new Date(invoice.expirationTime * 1000),
        createdAt: new Date(invoice.createdTime * 1000),
        metadata: invoice.metadata,
      };
    } catch (error) {
      logger.error('Failed to get BTCPay invoice status', {
        invoiceId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Map BTCPay status to internal status
   * @param {string} btcpayStatus - BTCPay status
   * @returns {string} Internal status
   */
  mapStatus(btcpayStatus) {
    const statusMap = {
      'New': 'pending',
      'Processing': 'confirming',
      'Expired': 'expired',
      'Invalid': 'cancelled',
      'Settled': 'confirmed',
      'Complete': 'confirmed',
    };
    
    return statusMap[btcpayStatus] || 'pending';
  }
  
  /**
   * Get invoice payments (transaction details)
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Payment transactions
   */
  async getInvoicePayments(invoiceId) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}/payments`
      );
      
      return response.data.map(payment => ({
        id: payment.id,
        status: payment.status,
        value: payment.value,
        fee: payment.fee,
        txId: payment.transactionId,
        destination: payment.destination,
        confirmations: payment.confirmations,
        receivedAt: new Date(payment.receivedDate),
      }));
    } catch (error) {
      logger.error('Failed to get BTCPay payments', {
        invoiceId,
        error: error.message,
      });
      return [];
    }
  }
  
  /**
   * Mark invoice as invalid/cancelled
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<boolean>} Success status
   */
  async markInvoiceInvalid(invoiceId) {
    try {
      await this.client.post(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}/status`,
        { status: 'Invalid' }
      );
      
      logger.logPayment('btcpay_invoice_cancelled', { invoiceId });
      return true;
    } catch (error) {
      logger.error('Failed to mark BTCPay invoice invalid', {
        invoiceId,
        error: error.message,
      });
      return false;
    }
  }
  
  /**
   * List recent invoices
   * @param {number} limit - Number of invoices to fetch
   * @returns {Promise<Array>} Invoice list
   */
  async listInvoices(limit = 50) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices`,
        { params: { limit } }
      );
      
      return response.data.map(invoice => ({
        invoiceId: invoice.id,
        status: this.mapStatus(invoice.status),
        amount: invoice.amount,
        currency: invoice.currency,
        orderId: invoice.metadata?.orderId,
        createdAt: new Date(invoice.createdTime * 1000),
      }));
    } catch (error) {
      logger.error('Failed to list BTCPay invoices', { error: error.message });
      return [];
    }
  }
  
  /**
   * Get server info
   * @returns {Promise<Object>} Server information
   */
  async getServerInfo() {
    try {
      const response = await this.client.get('/api/v1/server/info');
      return response.data;
    } catch (error) {
      logger.error('Failed to get BTCPay server info', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Verify webhook signature
   * @param {string} body - Request body
   * @param {string} signature - Webhook signature header
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(body, signature) {
    // BTCPay uses HMAC-SHA256 - must use dedicated BTCPay webhook secret
    const crypto = require('crypto');
    const webhookSecret = config.btcpay.webhookSecret;
    
    if (!webhookSecret) {
      throw new Error('BTCPAY_WEBHOOK_SECRET not configured');
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }
  
  /**
   * Process webhook event
   * @param {Object} event - Webhook event data
   * @returns {Object} Processed event data
   */
  processWebhookEvent(event) {
    const eventType = event.type;
    const invoiceId = event.invoiceId;
    
    logger.logWebhook('btcpay', eventType, {
      invoiceId,
      status: event.status,
    });
    
    return {
      type: eventType,
      invoiceId,
      orderId: event.metadata?.orderId,
      status: this.mapStatus(event.status || 'New'),
      data: event,
    };
  }
}

// Export singleton instance
module.exports = new BTCPayService();
