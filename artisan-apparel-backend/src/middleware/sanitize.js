/**
 * Input Sanitization Middleware
 * =============================
 * Sanitizes and validates all incoming request data.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const logger = require('../utils/logger');

/**
 * Dangerous patterns that should never appear in input
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /data:/gi, // Data URLs
  /vbscript:/gi, // VBScript protocol
  /expression\s*\(/gi, // CSS expressions
];

/**
 * SQL injection patterns
 */
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
  /(--|\|\||;)/g, // SQL comments and statement separators
  /(['"])\s*;\s*\1/g, // String-terminated statements
];

/**
 * Sanitize a string value
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  
  let sanitized = value
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize unicode
    .normalize('NFC');
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      logger.warn('Dangerous pattern detected in input', {
        pattern: pattern.toString(),
        truncatedValue: sanitized.substring(0, 100),
      });
      sanitized = sanitized.replace(pattern, '');
    }
  }
  
  return sanitized;
}

/**
 * Deep sanitize an object
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {any} Sanitized object
 */
function deepSanitize(obj, depth = 0) {
  // Prevent deep recursion attacks
  if (depth > 10) {
    logger.warn('Deep recursion detected in input sanitization');
    return null;
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    // Limit array size to prevent DoS
    if (obj.length > 1000) {
      logger.warn('Oversized array in input', { length: obj.length });
      obj = obj.slice(0, 1000);
    }
    return obj.map(item => deepSanitize(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    const keys = Object.keys(obj);
    
    // Limit number of keys to prevent DoS
    if (keys.length > 100) {
      logger.warn('Too many keys in input object', { keyCount: keys.length });
      return null;
    }
    
    for (const key of keys) {
      // Sanitize the key itself
      const sanitizedKey = sanitizeString(key);
      // Skip keys that become empty after sanitization
      if (sanitizedKey) {
        sanitized[sanitizedKey] = deepSanitize(obj[key], depth + 1);
      }
    }
    return sanitized;
  }
  
  // Numbers, booleans, etc. pass through
  return obj;
}

/**
 * Check for SQL injection attempts (logging only, not blocking)
 * @param {string} value - Value to check
 * @returns {boolean} Whether suspicious patterns were found
 */
function checkSQLInjection(value) {
  if (typeof value !== 'string') return false;
  
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * Deep check object for SQL injection patterns
 * @param {any} obj - Object to check
 * @returns {boolean} Whether suspicious patterns were found
 */
function deepCheckSQL(obj) {
  if (typeof obj === 'string') {
    return checkSQLInjection(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.some(item => deepCheckSQL(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(value => deepCheckSQL(value));
  }
  
  return false;
}

/**
 * Sanitization middleware
 * Sanitizes req.body, req.query, and req.params
 */
function sanitizeInput(req, res, next) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      // Check for SQL injection attempts (log but don't block - Sequelize handles this)
      if (deepCheckSQL(req.body)) {
        logger.warn('Potential SQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
      }
      
      req.body = deepSanitize(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      if (deepCheckSQL(req.query)) {
        logger.warn('Potential SQL injection in query params', {
          ip: req.ip,
          path: req.path,
        });
      }
      
      req.query = deepSanitize(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      if (deepCheckSQL(req.params)) {
        logger.warn('Potential SQL injection in URL params', {
          ip: req.ip,
          path: req.path,
        });
      }
      
      req.params = deepSanitize(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error', { error: error.message });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
    });
  }
}

/**
 * Validate email format strictly
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) return false;
  if (email.length > 254) return false;
  
  const parts = email.split('@');
  if (parts[0].length > 64) return false;
  
  return true;
}

/**
 * Validate order ID format
 * @param {string} orderId - Order ID to validate
 * @returns {boolean} Whether order ID is valid
 */
function isValidOrderId(orderId) {
  if (typeof orderId !== 'string') return false;
  return /^AA-\d{4}-\d{6}$/.test(orderId);
}

/**
 * Validate cryptocurrency address format
 * @param {string} address - Address to validate
 * @param {string} crypto - Cryptocurrency type
 * @returns {boolean} Whether address format is valid
 */
function isValidCryptoAddress(address, crypto) {
  if (typeof address !== 'string') return false;
  
  const patterns = {
    DCR: /^(Ds|Ts)[a-km-zA-HJ-NP-Z1-9]{33}$/,
    BTC: /^(1|3|bc1)[a-km-zA-HJ-NP-Z1-9]{25,62}$/,
    XMR: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
  };
  
  const pattern = patterns[crypto?.toUpperCase()];
  if (!pattern) return true; // Allow unknown crypto types
  
  return pattern.test(address);
}

module.exports = {
  sanitizeInput,
  sanitizeString,
  deepSanitize,
  isValidEmail,
  isValidOrderId,
  isValidCryptoAddress,
};
