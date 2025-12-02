/**
 * Payment Controller
 * ==================
 * Handles cryptocurrency payment operations.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { Order, Payment, CryptoRate } = require('../models');
const decredService = require('../services/decredService');
const krakenService = require('../services/krakenService');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Get cryptocurrency rate
 * GET /api/rates/:cryptocurrency
 */
async function getCryptoRate(req, res) {
  try {
    const { cryptocurrency } = req.params;
    const crypto = cryptocurrency.toUpperCase();
    
    // Validate cryptocurrency
    const supportedCryptos = ['DCR', 'BTC', 'XMR', 'ETH', 'LTC'];
    if (!supportedCryptos.includes(crypto)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported cryptocurrency: ${crypto}`,
        supported: supportedCryptos,
      });
    }
    
    // Get rate (uses cache internally)
    const rate = await krakenService.getCurrentPrice(crypto);
    
    // Get cached record for metadata
    const cachedRate = await CryptoRate.getLatestRate(crypto);
    
    res.json({
      success: true,
      cryptocurrency: crypto,
      usd_rate: rate,
      last_updated: cachedRate?.fetched_at || new Date(),
      source: cachedRate?.source || 'kraken',
    });
  } catch (error) {
    logger.error('Get crypto rate failed', {
      cryptocurrency: req.params.cryptocurrency,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get exchange rate',
    });
  }
}

/**
 * Check payment status for an order
 * GET /api/payments/:orderId/status
 */
async function checkPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    
    const payment = await Payment.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }
    
    // For DCR, check blockchain directly
    if (payment.cryptocurrency === 'DCR') {
      try {
        const blockchainStatus = await decredService.checkPayment(
          payment.payment_address,
          parseFloat(payment.expected_amount)
        );
        
        res.json({
          success: true,
          payment: {
            order_id: payment.order_id,
            status: payment.status,
            cryptocurrency: payment.cryptocurrency,
            address: payment.payment_address,
            expected_amount: payment.expected_amount,
            received_amount: payment.received_amount,
            blockchain: blockchainStatus,
            expires_at: payment.expires_at,
            is_expired: payment.isExpired(),
            time_remaining_ms: payment.getTimeRemaining(),
          },
        });
      } catch (error) {
        // Fall back to database status if blockchain check fails
        res.json({
          success: true,
          payment: {
            order_id: payment.order_id,
            status: payment.status,
            cryptocurrency: payment.cryptocurrency,
            expected_amount: payment.expected_amount,
            received_amount: payment.received_amount,
            expires_at: payment.expires_at,
            is_expired: payment.isExpired(),
          },
        });
      }
    } else {
      // For other cryptocurrencies
      res.json({
        success: true,
        payment: {
          order_id: payment.order_id,
          status: payment.status,
          cryptocurrency: payment.cryptocurrency,
          expected_amount: payment.expected_amount,
          received_amount: payment.received_amount,
          transaction_hash: payment.transaction_hash,
          confirmations: payment.confirmations,
          expires_at: payment.expires_at,
          is_expired: payment.isExpired(),
        },
      });
    }
  } catch (error) {
    logger.error('Check payment status failed', {
      orderId: req.params.orderId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status',
    });
  }
}

/**
 * Manually verify a payment (admin)
 * POST /api/payments/:orderId/verify
 */
async function verifyPayment(req, res) {
  try {
    const { orderId } = req.params;
    const { transaction_hash, amount, force = false } = req.body;
    
    const order = await Order.findOne({ where: { order_id: orderId } });
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    
    if (!order || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Order or payment not found',
      });
    }
    
    if (order.payment_status === 'confirmed' && !force) {
      return res.status(400).json({
        success: false,
        error: 'Payment already confirmed',
      });
    }
    
    // Update payment record
    await payment.update({
      status: 'confirmed',
      transaction_hash: transaction_hash || payment.transaction_hash,
      received_amount: amount || payment.expected_amount,
      confirmed_at: new Date(),
    });
    
    // Update order
    await order.update({
      payment_status: 'confirmed',
      transaction_hash: transaction_hash || order.transaction_hash,
      order_status: 'paid',
    });
    
    logger.logPayment('payment_manually_verified', {
      orderId,
      verifiedBy: req.isAdmin ? 'admin' : 'system',
      txHash: transaction_hash,
    });
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    logger.error('Manual payment verification failed', {
      orderId: req.params.orderId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
    });
  }
}

/**
 * Get wallet balances (admin)
 * GET /api/payments/balances
 */
async function getWalletBalances(req, res) {
  try {
    const balances = {};
    
    // Get DCR balance
    try {
      balances.DCR = await decredService.getBalance();
    } catch (error) {
      balances.DCR = { error: error.message };
    }
    
    // Get Kraken balances
    if (krakenService.isConfigured()) {
      try {
        balances.exchange = await krakenService.getBalances();
      } catch (error) {
        balances.exchange = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      balances,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Get wallet balances failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balances',
    });
  }
}

/**
 * Trigger crypto-to-USD conversion (admin)
 * POST /api/payments/convert
 */
async function convertCryptoToUSD(req, res) {
  try {
    const { cryptocurrency, amount, all = false } = req.body;
    
    if (!krakenService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Exchange API not configured',
      });
    }
    
    let result;
    
    if (all) {
      // Convert all crypto holdings
      result = await krakenService.weeklyConversion(
        config.payment.autoConvertThreshold
      );
    } else if (cryptocurrency && amount) {
      // Convert specific amount
      result = await krakenService.convertToUSD(cryptocurrency, amount);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Specify cryptocurrency and amount, or set all=true',
      });
    }
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Crypto conversion failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to convert cryptocurrency',
    });
  }
}

/**
 * Withdraw USD to bank (admin)
 * POST /api/payments/withdraw
 */
async function withdrawToBank(req, res) {
  try {
    const { amount } = req.body;
    
    if (!krakenService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Exchange API not configured',
      });
    }
    
    const result = await krakenService.withdrawToBank(amount || 'all');
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Bank withdrawal failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw to bank',
    });
  }
}

/**
 * Get payment history (admin)
 * GET /api/payments/history
 */
async function getPaymentHistory(req, res) {
  try {
    const { status, cryptocurrency, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (cryptocurrency) where.cryptocurrency = cryptocurrency.toUpperCase();
    
    const payments = await Payment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [{
        model: Order,
        as: 'order',
        attributes: ['customer_email', 'total_usd'],
      }],
    });
    
    res.json({
      success: true,
      payments: payments.rows,
      total: payments.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    logger.error('Get payment history failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history',
    });
  }
}

/**
 * Clean up expired payments (cron job)
 */
async function cleanupExpiredPayments() {
  try {
    const { Op } = require('sequelize');
    
    // Find expired pending payments
    const expiredPayments = await Payment.findAll({
      where: {
        status: 'pending',
        expires_at: { [Op.lt]: new Date() },
      },
    });
    
    for (const payment of expiredPayments) {
      // Update payment status
      await payment.update({ status: 'expired' });
      
      // Update order status
      await Order.update(
        { payment_status: 'expired', order_status: 'cancelled' },
        { where: { order_id: payment.order_id } }
      );
      
      // Stop monitoring
      decredService.stopMonitoring(payment.order_id);
      
      logger.logPayment('payment_expired_cleanup', {
        orderId: payment.order_id,
      });
    }
    
    // Clean up old rate cache
    await CryptoRate.cleanup(24); // Keep 24 hours
    
    logger.info('Payment cleanup complete', {
      expiredCount: expiredPayments.length,
    });
    
    return expiredPayments.length;
  } catch (error) {
    logger.error('Payment cleanup failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  getCryptoRate,
  checkPaymentStatus,
  verifyPayment,
  getWalletBalances,
  convertCryptoToUSD,
  withdrawToBank,
  getPaymentHistory,
  cleanupExpiredPayments,
};
