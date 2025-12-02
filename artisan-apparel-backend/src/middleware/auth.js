/**
 * Authentication Middleware
 * =========================
 * JWT and API key authentication for protected routes.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Verify JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', {
      ip: req.ip,
      error: error.message,
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }
    
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
    });
  }
}

/**
 * Verify admin API key
 */
function authenticateAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Admin API key required',
    });
  }
  
  if (apiKey !== config.security.adminApiKey) {
    logger.warn('Invalid admin API key attempt', {
      ip: req.ip,
    });
    
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
    });
  }
  
  req.isAdmin = true;
  next();
}

/**
 * Optional authentication - sets user if token present but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret);
      req.user = decoded;
    } catch (error) {
      // Token invalid but continue anyway
      req.user = null;
    }
  }
  
  next();
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Expiration time (default 24h)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, config.security.jwtSecret, { expiresIn });
}

/**
 * Generate order access token (for customers to track/modify orders)
 * @param {string} orderId - Order ID
 * @param {string} email - Customer email
 * @returns {string} Order access token
 */
function generateOrderToken(orderId, email) {
  return jwt.sign(
    { orderId, email, type: 'order_access' },
    config.security.jwtSecret,
    { expiresIn: '30d' }
  );
}

/**
 * Verify order access token
 */
function authenticateOrderAccess(req, res, next) {
  const token = req.params.token || req.query.token || req.headers['x-order-token'];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Order access token required',
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    if (decoded.type !== 'order_access') {
      throw new Error('Invalid token type');
    }
    
    req.orderAccess = {
      orderId: decoded.orderId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired order access token',
    });
  }
}

module.exports = {
  authenticateToken,
  authenticateAdmin,
  optionalAuth,
  generateToken,
  generateOrderToken,
  authenticateOrderAccess,
};
