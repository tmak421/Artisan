/**
 * Logger Utility
 * ==============
 * Winston-based logging with file rotation and console output.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Get config without circular dependency
const logLevel = process.env.LOG_LEVEL || 'info';
const logPath = process.env.LOG_FILE_PATH || './logs';
const isProduction = process.env.NODE_ENV === 'production';

// Ensure log directory exists
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Error log file
  new winston.transports.File({
    filename: path.join(logPath, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logPath, 'combined.log'),
    format: fileFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 10,
  }),
];

// Add console transport for development
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // In production, still log to console but with JSON format
  transports.push(
    new winston.transports.Console({
      format: fileFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: 'artisan-apparel' },
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logPath, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logPath, 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

/**
 * Log a payment event (specialized for crypto payments)
 * @param {string} event - Event type
 * @param {Object} data - Payment data
 */
logger.logPayment = (event, data) => {
  logger.info(`Payment Event: ${event}`, {
    category: 'payment',
    event,
    ...data,
  });
};

/**
 * Log an order event
 * @param {string} event - Event type
 * @param {Object} data - Order data
 */
logger.logOrder = (event, data) => {
  logger.info(`Order Event: ${event}`, {
    category: 'order',
    event,
    ...data,
  });
};

/**
 * Log a webhook event
 * @param {string} source - Webhook source
 * @param {string} event - Event type
 * @param {Object} data - Webhook data
 */
logger.logWebhook = (source, event, data) => {
  logger.info(`Webhook: ${source} - ${event}`, {
    category: 'webhook',
    source,
    event,
    ...data,
  });
};

/**
 * Log an API request
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, statusCode, duration) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, `${req.method} ${req.path}`, {
    category: 'request',
    method: req.method,
    path: req.path,
    statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

module.exports = logger;
