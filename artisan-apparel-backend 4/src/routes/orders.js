/**
 * Order Routes
 * ============
 * API endpoints for order management.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticateAdmin, authenticateOrderAccess } = require('../middleware/auth');

/**
 * Create a new order
 * POST /api/orders/create
 * 
 * Body:
 * - items: Array of order items
 * - customer: { email, name }
 * - shipping: { name, address1, address2?, city, state, zip, country, phone? }
 * - payment_method: Cryptocurrency code (DCR, BTC, etc.)
 */
router.post(
  '/create',
  [
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.product_id')
      .notEmpty()
      .withMessage('Product ID is required'),
    body('items.*.variant_id')
      .notEmpty()
      .withMessage('Variant ID is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('items.*.price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    body('customer.email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('customer.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 }),
    body('shipping.name')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Shipping name is required'),
    body('shipping.address1')
      .notEmpty()
      .trim()
      .withMessage('Address is required'),
    body('shipping.city')
      .notEmpty()
      .trim()
      .withMessage('City is required'),
    body('shipping.state')
      .optional()
      .trim(),
    body('shipping.zip')
      .notEmpty()
      .trim()
      .withMessage('ZIP/Postal code is required'),
    body('shipping.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country must be 2-letter code'),
    body('payment_method')
      .notEmpty()
      .isIn(['DCR', 'BTC', 'XMR', 'LTC', 'ETH', 'dcr', 'btc', 'xmr', 'ltc', 'eth'])
      .withMessage('Valid payment method required'),
  ],
  orderController.createOrder
);

/**
 * Get order status
 * GET /api/orders/:orderId
 */
router.get(
  '/:orderId',
  [
    param('orderId')
      .matches(/^AA-\d{4}-\d{6}$/)
      .withMessage('Invalid order ID format'),
  ],
  orderController.getOrderStatus
);

/**
 * List all orders (admin only)
 * GET /api/orders
 */
router.get(
  '/',
  authenticateAdmin,
  [
    query('status')
      .optional()
      .isIn(['pending_payment', 'paid', 'production', 'shipped', 'delivered', 'cancelled', 'refunded']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('offset')
      .optional()
      .isInt({ min: 0 }),
  ],
  orderController.listOrders
);

/**
 * Cancel an order (admin only)
 * POST /api/orders/:orderId/cancel
 */
router.post(
  '/:orderId/cancel',
  authenticateAdmin,
  [
    param('orderId')
      .matches(/^AA-\d{4}-\d{6}$/)
      .withMessage('Invalid order ID format'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }),
  ],
  orderController.cancelOrder
);

module.exports = router;
