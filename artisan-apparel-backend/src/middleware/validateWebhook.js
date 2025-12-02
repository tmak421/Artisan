/**
 * Webhook Validation Middleware
 * =============================
 * Validates webhook signatures from external services.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Validate generic webhook signature (HMAC-SHA256)
 * @param {string} secretKey - Secret key for validation
 * @param {string} signatureHeader - Header name containing signature
 */
function validateWebhook(secretKey, signatureHeader = 'x-webhook-signature') {
  return (req, res, next) => {
    const signature = req.headers[signatureHeader.toLowerCase()];
    
    if (!signature) {
      logger.warn('Webhook received without signature', {
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Webhook signature required',
      });
    }
    
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex');
    
    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      logger.warn('Invalid webhook signature', {
        path: req.path,
        ip: req.ip,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }
    
    next();
  };
}

/**
 * Validate Printful webhook
 */
function validatePrintfulWebhook(req, res, next) {
  // Printful includes webhook secret in the request
  // They also send X-Printful-Signature header in newer API versions
  const signature = req.headers['x-printful-signature'];
  
  if (config.printful.webhookSecret && signature) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.printful.webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      logger.warn('Invalid Printful webhook signature', { ip: req.ip });
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }
  }
  
  // Log webhook received
  logger.logWebhook('printful', req.body?.type || 'unknown', {
    orderId: req.body?.data?.order?.external_id,
  });
  
  next();
}

/**
 * Validate BTCPay Server webhook
 */
function validateBTCPayWebhook(req, res, next) {
  const signature = req.headers['btcpay-sig'];
  
  if (!signature) {
    logger.warn('BTCPay webhook without signature', { ip: req.ip });
    return res.status(401).json({
      success: false,
      error: 'Signature required',
    });
  }
  
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', config.security.webhookSecret)
    .update(rawBody)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    logger.warn('Invalid BTCPay webhook signature', { ip: req.ip });
    return res.status(403).json({
      success: false,
      error: 'Invalid signature',
    });
  }
  
  logger.logWebhook('btcpay', req.body?.type || 'unknown', {
    invoiceId: req.body?.invoiceId,
  });
  
  next();
}

/**
 * Validate Coinbase Commerce webhook
 */
function validateCoinbaseWebhook(req, res, next) {
  const signature = req.headers['x-cc-webhook-signature'];
  
  if (!signature) {
    logger.warn('Coinbase webhook without signature', { ip: req.ip });
    return res.status(401).json({
      success: false,
      error: 'Signature required',
    });
  }
  
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', config.coinbase.webhookSecret || config.security.webhookSecret)
    .update(rawBody)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    logger.warn('Invalid Coinbase webhook signature', { ip: req.ip });
    return res.status(403).json({
      success: false,
      error: 'Invalid signature',
    });
  }
  
  logger.logWebhook('coinbase', req.body?.event?.type || 'unknown', {
    chargeId: req.body?.event?.data?.id,
  });
  
  next();
}

/**
 * Validate internal payment webhook (from our own services)
 */
function validateInternalWebhook(req, res, next) {
  const signature = req.headers['x-internal-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      error: 'Signature and timestamp required',
    });
  }
  
  // Check timestamp is within 5 minutes
  const timestampMs = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    return res.status(403).json({
      success: false,
      error: 'Timestamp too old',
    });
  }
  
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.security.webhookSecret)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    logger.warn('Invalid internal webhook signature', { ip: req.ip });
    return res.status(403).json({
      success: false,
      error: 'Invalid signature',
    });
  }
  
  next();
}

/**
 * Store raw body for signature verification
 * Must be used before body parsers
 */
function captureRawBody(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

module.exports = {
  validateWebhook,
  validatePrintfulWebhook,
  validateBTCPayWebhook,
  validateCoinbaseWebhook,
  validateInternalWebhook,
  captureRawBody,
};
