/**
 * Webhook Routes
 * ==============
 * Handles incoming webhooks from external services.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const express = require('express');
const router = express.Router();

const { Order, Payment } = require('../models');
const { handlePaymentUpdate, createPrintfulOrder } = require('../controllers/orderController');
const printfulService = require('../services/printfulService');
const btcPayService = require('../services/btcPayService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const {
  validatePrintfulWebhook,
  validateBTCPayWebhook,
  validateCoinbaseWebhook,
  validateInternalWebhook,
} = require('../middleware/validateWebhook');

/**
 * Internal payment confirmation webhook
 * Called by our payment monitoring services
 * POST /api/webhooks/payment-confirmed
 */
router.post('/payment-confirmed', validateInternalWebhook, async (req, res) => {
  try {
    const { order_id, transaction_hash, amount, confirmations } = req.body;
    
    logger.logWebhook('internal', 'payment_confirmed', {
      orderId: order_id,
      amount,
      confirmations,
    });
    
    // Process the payment update
    await handlePaymentUpdate(order_id, {
      status: 'confirmed',
      received: amount,
      txHash: transaction_hash,
      confirmations,
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Payment webhook processing failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * Printful webhook
 * Handles order status updates from Printful
 * POST /api/webhooks/printful
 */
router.post('/printful', validatePrintfulWebhook, async (req, res) => {
  try {
    const event = printfulService.processWebhookEvent(req.body);
    
    // Find the order
    const order = await Order.findOne({
      where: { order_id: event.orderId },
    });
    
    if (!order) {
      logger.warn('Printful webhook for unknown order', {
        orderId: event.orderId,
        printfulId: event.printfulId,
      });
      return res.json({ success: true, message: 'Order not found' });
    }
    
    // Handle different event types
    switch (event.type) {
      case 'shipped':
        // Update order with tracking info
        await order.update({
          order_status: 'shipped',
          tracking_number: event.shipment?.trackingNumber,
          tracking_url: event.shipment?.trackingUrl,
          carrier: event.shipment?.carrier,
        });
        
        // Send shipping notification email
        await emailService.sendShippingNotification(order);
        
        logger.logOrder('order_shipped', {
          orderId: order.order_id,
          trackingNumber: event.shipment?.trackingNumber,
        });
        break;
        
      case 'created':
        // Order created in Printful (confirmation)
        if (order.printful_order_id !== event.printfulId?.toString()) {
          await order.update({
            printful_order_id: event.printfulId?.toString(),
          });
        }
        break;
        
      case 'failed':
        // Order failed in Printful
        logger.error('Printful order failed', {
          orderId: order.order_id,
          printfulId: event.printfulId,
          rawData: event.raw,
        });
        
        // Could send admin notification here
        break;
        
      case 'cancelled':
        // Order cancelled in Printful
        await order.update({ order_status: 'cancelled' });
        await emailService.sendOrderCancellation(order, 'Order cancelled by fulfillment partner');
        break;
        
      default:
        logger.info('Unhandled Printful event', { type: event.type });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Printful webhook processing failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * BTCPay Server webhook
 * Handles Bitcoin payment updates
 * POST /api/webhooks/btcpay
 */
router.post('/btcpay', validateBTCPayWebhook, async (req, res) => {
  try {
    const event = btcPayService.processWebhookEvent(req.body);
    
    if (!event.orderId) {
      logger.warn('BTCPay webhook without order ID', { invoiceId: event.invoiceId });
      return res.json({ success: true, message: 'No order ID' });
    }
    
    const order = await Order.findOne({
      where: { order_id: event.orderId },
    });
    
    if (!order) {
      logger.warn('BTCPay webhook for unknown order', { orderId: event.orderId });
      return res.json({ success: true, message: 'Order not found' });
    }
    
    // Get full invoice details
    const invoice = await btcPayService.getInvoiceStatus(event.invoiceId);
    const payments = await btcPayService.getInvoicePayments(event.invoiceId);
    const payment = payments[0]; // Get first payment
    
    // Update based on status
    switch (event.status) {
      case 'confirmed':
        await handlePaymentUpdate(event.orderId, {
          status: 'confirmed',
          received: parseFloat(invoice.amount),
          txHash: payment?.txId,
          confirmations: payment?.confirmations || 1,
        });
        break;
        
      case 'confirming':
        await handlePaymentUpdate(event.orderId, {
          status: 'confirming',
        });
        break;
        
      case 'expired':
        await handlePaymentUpdate(event.orderId, {
          status: 'expired',
        });
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('BTCPay webhook processing failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * Coinbase Commerce webhook
 * Handles multi-crypto payment updates
 * POST /api/webhooks/coinbase
 */
router.post('/coinbase', validateCoinbaseWebhook, async (req, res) => {
  try {
    const { event } = req.body;
    const eventType = event?.type;
    const chargeData = event?.data;
    const orderId = chargeData?.metadata?.order_id;
    
    logger.logWebhook('coinbase', eventType, { orderId, chargeId: chargeData?.id });
    
    if (!orderId) {
      return res.json({ success: true, message: 'No order ID' });
    }
    
    const order = await Order.findOne({
      where: { order_id: orderId },
    });
    
    if (!order) {
      return res.json({ success: true, message: 'Order not found' });
    }
    
    switch (eventType) {
      case 'charge:confirmed':
        const payment = chargeData.payments?.[0];
        await handlePaymentUpdate(orderId, {
          status: 'confirmed',
          received: parseFloat(chargeData.pricing?.local?.amount || 0),
          txHash: payment?.transaction_id,
          confirmations: 1,
        });
        break;
        
      case 'charge:pending':
        await handlePaymentUpdate(orderId, { status: 'confirming' });
        break;
        
      case 'charge:failed':
      case 'charge:expired':
        await handlePaymentUpdate(orderId, { status: 'expired' });
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Coinbase webhook processing failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * Shopify webhook (optional)
 * For order sync if using Shopify storefront
 * POST /api/webhooks/shopify
 */
router.post('/shopify', async (req, res) => {
  try {
    const topic = req.headers['x-shopify-topic'];
    const shopifyOrderId = req.body?.id;
    
    logger.logWebhook('shopify', topic, { shopifyOrderId });
    
    // Handle different Shopify webhook topics
    switch (topic) {
      case 'orders/create':
        // Could sync order to our system
        break;
      case 'orders/updated':
        // Could update order status
        break;
      case 'orders/cancelled':
        // Could cancel order
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Shopify webhook processing failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * Health check for webhooks
 * GET /api/webhooks/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint operational',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
