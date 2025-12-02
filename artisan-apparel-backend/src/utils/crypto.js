/**
 * Crypto Utilities
 * ================
 * Helper functions for cryptocurrency operations.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generate a unique order ID with prefix
 * Format: AA-YYYY-XXXXXX (e.g., AA-2024-001234)
 * @returns {string} Unique order ID
 */
function generateOrderId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `AA-${year}-${random}`;
}

/**
 * Generate a secure webhook signature
 * @param {string} payload - Request body as string
 * @param {string} secret - Webhook secret
 * @returns {string} HMAC signature
 */
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a webhook signature
 * @param {string} payload - Request body as string
 * @param {string} signature - Provided signature
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate a payment QR code as data URL
 * @param {string} cryptocurrency - Currency code (DCR, BTC, XMR)
 * @param {string} address - Payment address
 * @param {number} amount - Payment amount
 * @returns {Promise<string>} QR code as data URL
 */
async function generatePaymentQR(cryptocurrency, address, amount) {
  let uri;
  
  switch (cryptocurrency.toUpperCase()) {
    case 'DCR':
      uri = `decred:${address}?amount=${amount}`;
      break;
    case 'BTC':
      uri = `bitcoin:${address}?amount=${amount}`;
      break;
    case 'XMR':
      uri = `monero:${address}?tx_amount=${amount}`;
      break;
    default:
      uri = address;
  }
  
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#1a1a2e', // Artisan Apparel dark color
      light: '#ffffff',
    },
  });
}

/**
 * Format cryptocurrency amount with appropriate decimal places
 * @param {number} amount - Amount to format
 * @param {string} cryptocurrency - Currency code
 * @returns {string} Formatted amount
 */
function formatCryptoAmount(amount, cryptocurrency) {
  const decimals = {
    BTC: 8,
    DCR: 8,
    XMR: 12,
    ETH: 18,
    LTC: 8,
  };
  
  const precision = decimals[cryptocurrency.toUpperCase()] || 8;
  return parseFloat(amount).toFixed(precision);
}

/**
 * Calculate crypto amount from USD with markup
 * @param {number} usdAmount - Amount in USD
 * @param {number} cryptoRate - Current crypto rate (1 crypto = X USD)
 * @param {number} markupPercent - Optional markup percentage (default 1%)
 * @returns {number} Crypto amount
 */
function calculateCryptoAmount(usdAmount, cryptoRate, markupPercent = 1) {
  const markup = 1 + (markupPercent / 100);
  return (usdAmount * markup) / cryptoRate;
}

/**
 * Validate cryptocurrency address format
 * @param {string} address - Address to validate
 * @param {string} cryptocurrency - Currency code
 * @returns {boolean} Whether address format is valid
 */
function validateCryptoAddress(address, cryptocurrency) {
  const patterns = {
    // Decred addresses start with Ds (mainnet) or Ts (testnet)
    DCR: /^(Ds|Ts)[a-km-zA-HJ-NP-Z1-9]{33}$/,
    // Bitcoin addresses (Legacy, SegWit, Native SegWit)
    BTC: /^(1|3|bc1)[a-km-zA-HJ-NP-Z1-9]{25,62}$/,
    // Monero addresses (95 characters starting with 4)
    XMR: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
    // Litecoin
    LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
    // Ethereum
    ETH: /^0x[a-fA-F0-9]{40}$/,
  };
  
  const pattern = patterns[cryptocurrency.toUpperCase()];
  if (!pattern) return true; // Allow unknown cryptocurrencies
  
  return pattern.test(address);
}

/**
 * Get payment status priority for sorting
 * @param {string} status - Payment status
 * @returns {number} Priority (lower = more urgent)
 */
function getStatusPriority(status) {
  const priorities = {
    pending: 1,
    confirming: 2,
    underpaid: 3,
    confirmed: 4,
    expired: 5,
    cancelled: 6,
  };
  
  return priorities[status] || 99;
}

/**
 * Generate a random hex string
 * @param {number} length - Length in bytes
 * @returns {string} Random hex string
 */
function generateRandomHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data for logging
 * @param {string} data - Data to hash
 * @returns {string} Truncated hash for logging
 */
function hashForLogging(data) {
  if (!data) return 'N/A';
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Check if a transaction hash is valid format
 * @param {string} hash - Transaction hash
 * @param {string} cryptocurrency - Currency code
 * @returns {boolean} Whether hash format is valid
 */
function validateTxHash(hash, cryptocurrency) {
  // Most crypto tx hashes are 64 hex characters
  const pattern = /^[a-fA-F0-9]{64}$/;
  return pattern.test(hash);
}

/**
 * Calculate expiry timestamp for payment
 * @param {number} minutes - Minutes until expiry
 * @returns {Date} Expiry timestamp
 */
function calculateExpiryTime(minutes = 60) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

module.exports = {
  generateOrderId,
  generateWebhookSignature,
  verifyWebhookSignature,
  generatePaymentQR,
  formatCryptoAmount,
  calculateCryptoAmount,
  validateCryptoAddress,
  getStatusPriority,
  generateRandomHex,
  hashForLogging,
  validateTxHash,
  calculateExpiryTime,
};
