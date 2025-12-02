/**
 * Environment Configuration
 * =========================
 * Centralizes all environment variable access with validation and defaults.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

require('dotenv').config();

// Helper to get required environment variables
const getRequired = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

// Helper to get optional environment variables with defaults
const getOptional = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

// Helper to parse boolean environment variables
const getBoolean = (key, defaultValue = false) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper to parse integer environment variables
const getInt = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = {
  // Server
  nodeEnv: getOptional('NODE_ENV', 'development'),
  port: getInt('PORT', 3000),
  apiVersion: getOptional('API_VERSION', 'v1'),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Database
  database: {
    host: getOptional('DB_HOST', 'localhost'),
    port: getInt('DB_PORT', 5432),
    name: getOptional('DB_NAME', 'artisan_apparel'),
    user: getOptional('DB_USER', 'artisan_user'),
    password: getRequired('DB_PASSWORD'),
    ssl: getBoolean('DB_SSL', false),
    // Connection pool settings
    pool: {
      max: getInt('DB_POOL_MAX', 20),
      min: getInt('DB_POOL_MIN', 5),
      acquire: getInt('DB_POOL_ACQUIRE', 30000),
      idle: getInt('DB_POOL_IDLE', 10000),
    },
  },

  // Security
  security: {
    jwtSecret: getRequired('JWT_SECRET'),
    webhookSecret: getRequired('WEBHOOK_SECRET'),
    adminApiKey: getOptional('ADMIN_API_KEY', ''),
  },

  // Decred Configuration
  decred: {
    rpcUrl: getOptional('DCR_RPC_URL', 'http://127.0.0.1:9109'),
    rpcUser: getOptional('DCR_RPC_USER', ''),
    rpcPassword: getOptional('DCR_RPC_PASSWORD', ''),
    testnet: getBoolean('DCR_TESTNET', false),
    minConfirmations: getInt('DCR_MIN_CONFIRMATIONS', 2),
  },

  // BTCPay Server Configuration
  btcpay: {
    url: getOptional('BTCPAY_URL', ''),
    apiKey: getOptional('BTCPAY_API_KEY', ''),
    storeId: getOptional('BTCPAY_STORE_ID', ''),
    webhookSecret: getOptional('BTCPAY_WEBHOOK_SECRET', ''),
  },

  // Coinbase Commerce Configuration
  coinbase: {
    apiKey: getOptional('COINBASE_COMMERCE_API_KEY', ''),
    webhookSecret: getOptional('COINBASE_COMMERCE_WEBHOOK_SECRET', ''),
  },

  // Monero Configuration
  monero: {
    rpcUrl: getOptional('XMR_RPC_URL', 'http://127.0.0.1:18082'),
    rpcUser: getOptional('XMR_RPC_USER', ''),
    rpcPassword: getOptional('XMR_RPC_PASSWORD', ''),
    minConfirmations: getInt('XMR_MIN_CONFIRMATIONS', 10),
  },

  // Kraken Exchange Configuration
  kraken: {
    apiKey: getOptional('KRAKEN_API_KEY', ''),
    apiSecret: getOptional('KRAKEN_API_SECRET', ''),
    withdrawalKey: getOptional('KRAKEN_WITHDRAWAL_KEY', ''),
  },

  // Printful Configuration
  printful: {
    apiKey: getRequired('PRINTFUL_API_KEY'),
    webhookSecret: getOptional('PRINTFUL_WEBHOOK_SECRET', ''),
    apiUrl: 'https://api.printful.com',
  },

  // Shopify Configuration
  shopify: {
    shopName: getOptional('SHOPIFY_SHOP_NAME', ''),
    apiKey: getOptional('SHOPIFY_API_KEY', ''),
    apiSecret: getOptional('SHOPIFY_API_SECRET', ''),
    accessToken: getOptional('SHOPIFY_ACCESS_TOKEN', ''),
  },

  // SendGrid Configuration
  email: {
    apiKey: getRequired('SENDGRID_API_KEY'),
    from: getOptional('EMAIL_FROM', 'orders@artisanapparel.com'),
    fromName: getOptional('EMAIL_FROM_NAME', 'Artisan Apparel'),
  },

  // URLs
  urls: {
    frontend: getOptional('FRONTEND_URL', 'https://artisanapparel.com'),
    orderSuccess: getOptional('ORDER_SUCCESS_URL', 'https://artisanapparel.com/order/success'),
    orderCancel: getOptional('ORDER_CANCEL_URL', 'https://artisanapparel.com/order/cancel'),
    orderTrack: getOptional('ORDER_TRACK_URL', 'https://artisanapparel.com/track'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getInt('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    maxRequests: getInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // Logging
  logging: {
    level: getOptional('LOG_LEVEL', 'info'),
    filePath: getOptional('LOG_FILE_PATH', './logs'),
  },

  // Payment Settings
  payment: {
    expiryMinutes: getInt('PAYMENT_EXPIRY_MINUTES', 60),
    rateCacheSeconds: getInt('CRYPTO_RATE_CACHE_SECONDS', 300),
    autoConvertThreshold: getInt('AUTO_CONVERT_THRESHOLD_USD', 100),
  },
};
