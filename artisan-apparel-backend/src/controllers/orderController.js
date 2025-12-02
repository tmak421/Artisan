/**
 * Order Controller
 * ================
 * Handles order creation, retrieval, and management.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { validationResult } = require('express-validator');
const { Order, Payment, Review } = require('../models');
const decredService = require('../services/decredService');
const btcPayService = require('../services/btcPayService');
const krakenService = require('../services/krakenService');
const printfulService = require('../services/printfulService');
const emailService = require('../services/emailService');
const config = require('../config/env');
const logger = require('../utils/logger');
const {
  generateOrderId,
  generatePaymentQR,
  calculateCryptoAmount,
  calculateExpiryTime,
} = require('../utils/crypto');

/**
 * Create a new order
 * POST /api/orders/create
 */
async function createOrder(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    
    const { items, customer, shipping, payment_method } = req.body;
    
    // Calculate order total
    const totalUsd = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    if (totalUsd <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Order total must be greater than zero',
      });
    }
    
    // Generate unique order ID
    const orderId = generateOrderId();
    
    // Get crypto rate and calculate amount
    const cryptocurrency = payment_method.toUpperCase();
    let cryptoAmount, paymentAddress, paymentDetails;
    
    try {
      const cryptoRate = await krakenService.getCurrentPrice(cryptocurrency);
      cryptoAmount = calculateCryptoAmount(totalUsd, cryptoRate, 1); // 1% markup
      
      // Generate payment address based on cryptocurrency
      if (cryptocurrency === 'DCR') {
        paymentAddress = await decredService.generateAddress(orderId);
      } else if (cryptocurrency === 'BTC' && btcPayService.isConfigured()) {
        const invoice = await btcPayService.createInvoice(
          orderId,
          totalUsd,
          customer.email,
          { items }
        );
        paymentAddress = invoice.paymentMethods[0]?.destination;
        paymentDetails = invoice;
      } else {
        return res.status(400).json({
          success: false,
          error: `Payment method ${cryptocurrency} not available`,
        });
      }
    } catch (error) {
      logger.error('Failed to set up payment', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to set up payment. Please try again.',
      });
    }
    
    // Create order in database
    const order = await Order.create({
      order_id: orderId,
      customer_email: customer.email,
      customer_name: customer.name,
      shipping_address: {
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || '',
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country || 'US',
        phone: shipping.phone || '',
      },
      items,
      total_usd: totalUsd,
      crypto_currency: cryptocurrency,
      crypto_amount: cryptoAmount,
      payment_address: paymentAddress,
      payment_status: 'pending',
      order_status: 'pending_payment',
    });
    
    // Create payment record
    const expiresAt = calculateExpiryTime(config.payment.expiryMinutes);
    
    await Payment.create({
      order_id: orderId,
      cryptocurrency,
      payment_address: paymentAddress,
      expected_amount: cryptoAmount,
      expires_at: expiresAt,
      status: 'pending',
    });
    
    // Generate QR code
    const qrCode = await generatePaymentQR(cryptocurrency, paymentAddress, cryptoAmount);
    
    // Start monitoring for DCR payments
    if (cryptocurrency === 'DCR') {
      decredService.startMonitoring(
        paymentAddress,
        cryptoAmount,
        orderId,
        handlePaymentUpdate,
        config.payment.expiryMinutes
      );
    }
    
    // Send payment pending email
    await emailService.sendPaymentPending(order, { payment_address: paymentAddress, expected_amount: cryptoAmount, expires_at: expiresAt });
    
    logger.logOrder('order_created', {
      orderId,
      totalUsd,
      cryptocurrency,
      cryptoAmount,
    });
    
    // Return response
    res.status(201).json({
      success: true,
      order_id: orderId,
      payment: {
        cryptocurrency,
        address: paymentAddress,
        amount: parseFloat(cryptoAmount).toFixed(8),
        usd_equivalent: totalUsd,
        expires_at: expiresAt,
        ...(paymentDetails?.checkoutLink && { checkout_url: paymentDetails.checkoutLink }),
      },
      qr_code: qrCode,
    });
  } catch (error) {
    logger.error('Order creation failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
}

/**
 * Handle payment status updates (callback from payment services)
 */
async function handlePaymentUpdate(orderId, paymentData) {
  try {
    const order = await Order.findOne({ where: { order_id: orderId } });
    if (!order) {
      logger.error('Order not found for payment update', { orderId });
      return;
    }
    
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    
    if (paymentData.status === 'confirmed') {
      // Update payment record
      if (payment) {
        await payment.update({
          status: 'confirmed',
          received_amount: paymentData.received,
          transaction_hash: paymentData.txHash,
          confirmations: paymentData.confirmations,
          confirmed_at: new Date(),
        });
      }
      
      // Update order status
      await order.update({
        payment_status: 'confirmed',
        transaction_hash: paymentData.txHash,
        order_status: 'paid',
      });
      
      // Create Printful order
      await createPrintfulOrder(order);
      
      // Send confirmation email
      await emailService.sendOrderConfirmation(order);
      
      logger.logPayment('payment_confirmed', {
        orderId,
        amount: paymentData.received,
        txHash: paymentData.txHash,
      });
    } else if (paymentData.status === 'confirming') {
      // Payment detected but not yet confirmed
      if (payment) {
        await payment.update({
          status: 'confirming',
          detected_at: new Date(),
        });
      }
      
      await order.update({ payment_status: 'confirming' });
      
      logger.logPayment('payment_detecting', { orderId });
    } else if (paymentData.status === 'expired') {
      // Payment expired
      if (payment) {
        await payment.update({ status: 'expired' });
      }
      
      await order.update({
        payment_status: 'expired',
        order_status: 'cancelled',
      });
      
      await emailService.sendOrderCancellation(order, 'Payment not received within time limit');
      
      logger.logPayment('payment_expired', { orderId });
    }
  } catch (error) {
    logger.error('Payment update handling failed', {
      orderId,
      error: error.message,
    });
  }
}

/**
 * Create order in Printful
 */
async function createPrintfulOrder(order) {
  try {
    const printfulOrder = await printfulService.createOrder({
      externalId: order.order_id,
      order: {
        customer_email: order.customer_email,
        total_usd: order.total_usd,
      },
      shipping: order.shipping_address,
      items: order.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
        files: item.files || [],
        name: item.name,
      })),
    });
    
    // Update order with Printful ID
    await order.update({
      printful_order_id: printfulOrder.id.toString(),
      order_status: 'production',
    });
    
    logger.logOrder('printful_order_created', {
      orderId: order.order_id,
      printfulId: printfulOrder.id,
    });
    
    return printfulOrder;
  } catch (error) {
    logger.error('Printful order creation failed', {
      orderId: order.order_id,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get order status
 * GET /api/orders/:orderId
 */
async function getOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({
      where: { order_id: orderId },
      include: [
        { model: Payment, as: 'payments' },
      ],
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
    
    // Get Printful status if available
    let fulfillmentStatus = null;
    if (order.printful_order_id) {
      try {
        fulfillmentStatus = await printfulService.getOrderStatus(order.printful_order_id);
      } catch (error) {
        logger.warn('Failed to get Printful status', {
          orderId,
          error: error.message,
        });
      }
    }
    
    res.json({
      success: true,
      order: {
        order_id: order.order_id,
        status: order.order_status,
        created_at: order.created_at,
        payment: {
          status: order.payment_status,
          cryptocurrency: order.crypto_currency,
          transaction_hash: order.transaction_hash,
        },
        shipment: order.tracking_number ? {
          carrier: order.carrier,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
        } : null,
        fulfillment: fulfillmentStatus,
      },
    });
  } catch (error) {
    logger.error('Get order status failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get order status',
    });
  }
}

/**
 * List orders (admin)
 * GET /api/orders
 */
async function listOrders(req, res) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) {
      where.order_status = status;
    }
    
    const orders = await Order.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    
    res.json({
      success: true,
      orders: orders.rows.map(o => o.getSummary()),
      total: orders.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    logger.error('List orders failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list orders',
    });
  }
}

/**
 * Cancel order
 * POST /api/orders/:orderId/cancel
 */
async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findOne({ where: { order_id: orderId } });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
    
    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled in current status',
      });
    }
    
    // Stop payment monitoring
    decredService.stopMonitoring(orderId);
    
    // Cancel Printful order if exists
    if (order.printful_order_id) {
      await printfulService.cancelOrder(order.printful_order_id);
    }
    
    // Update order status
    await order.update({
      order_status: 'cancelled',
      notes: reason || 'Cancelled by admin',
    });
    
    // Send cancellation email
    await emailService.sendOrderCancellation(order, reason);
    
    logger.logOrder('order_cancelled', { orderId, reason });
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel order failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
}

// Export handler for use in webhooks
module.exports = {
  createOrder,
  getOrderStatus,
  listOrders,
  cancelOrder,
  handlePaymentUpdate,
  createPrintfulOrder,
};
