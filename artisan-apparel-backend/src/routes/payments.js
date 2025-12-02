/**
 * Payment Routes
 * ==============
 * API endpoints for payment operations.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const express = require('express');
const { param, query, body } = require('express-validator');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Get cryptocurrency exchange rate
 * GET /api/rates/:cryptocurrency
 */
router.get(
  '/rates/:cryptocurrency',
  [
    param('cryptocurrency')
      .isIn(['DCR', 'BTC', 'XMR', 'ETH', 'LTC', 'dcr', 'btc', 'xmr', 'eth', 'ltc'])
      .withMessage('Unsupported cryptocurrency'),
  ],
  paymentController.getCryptoRate
);

/**
 * Check payment status for an order
 * GET /api/payments/:orderId/status
 */
router.get(
  '/:orderId/status',
  [
    param('orderId')
      .matches(/^AA-\d{4}-\d{6}$/)
      .withMessage('Invalid order ID format'),
  ],
  paymentController.checkPaymentStatus
);

/**
 * Manually verify a payment (admin only)
 * POST /api/payments/:orderId/verify
 */
router.post(
  '/:orderId/verify',
  authenticateAdmin,
  [
    param('orderId')
      .matches(/^AA-\d{4}-\d{6}$/)
      .withMessage('Invalid order ID format'),
    body('transaction_hash')
      .optional()
      .isHexadecimal()
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid transaction hash'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be positive'),
    body('force')
      .optional()
      .isBoolean(),
  ],
  paymentController.verifyPayment
);

/**
 * Get wallet balances (admin only)
 * GET /api/payments/balances
 */
router.get(
  '/balances',
  authenticateAdmin,
  paymentController.getWalletBalances
);

/**
 * Convert crypto to USD (admin only)
 * POST /api/payments/convert
 */
router.post(
  '/convert',
  authenticateAdmin,
  [
    body('cryptocurrency')
      .optional()
      .isIn(['DCR', 'BTC', 'XMR', 'ETH', 'LTC']),
    body('amount')
      .optional()
      .isFloat({ min: 0 }),
    body('all')
      .optional()
      .isBoolean(),
  ],
  paymentController.convertCryptoToUSD
);

/**
 * Withdraw USD to bank (admin only)
 * POST /api/payments/withdraw
 */
router.post(
  '/withdraw',
  authenticateAdmin,
  [
    body('amount')
      .optional()
      .isFloat({ min: 0 }),
  ],
  paymentController.withdrawToBank
);

/**
 * Get payment history (admin only)
 * GET /api/payments/history
 */
router.get(
  '/history',
  authenticateAdmin,
  [
    query('status')
      .optional()
      .isIn(['pending', 'detected', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'expired', 'refunded']),
    query('cryptocurrency')
      .optional()
      .isIn(['DCR', 'BTC', 'XMR', 'ETH', 'LTC']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('offset')
      .optional()
      .isInt({ min: 0 }),
  ],
  paymentController.getPaymentHistory
);

module.exports = router;
