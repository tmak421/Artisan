/**
 * Review Routes
 * =============
 * API endpoints for product reviews.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Submit a review
 * POST /api/reviews/submit
 */
router.post(
  '/submit',
  [
    body('order_id')
      .matches(/^AA-\d{4}-\d{6}$/)
      .withMessage('Invalid order ID format'),
    body('product_id')
      .optional()
      .notEmpty()
      .withMessage('Product ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review_title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be under 200 characters'),
    body('review_text')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Review must be under 5000 characters'),
    body('reviewer_name')
      .optional()
      .trim()
      .isLength({ max: 100 }),
    body('is_anonymous')
      .optional()
      .isBoolean(),
  ],
  reviewController.submitReview
);

/**
 * Get reviews for a product
 * GET /api/reviews/:productId
 */
router.get(
  '/:productId',
  [
    param('productId')
      .notEmpty()
      .withMessage('Product ID is required'),
    query('sort')
      .optional()
      .isIn(['recent', 'helpful', 'rating_high', 'rating_low']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('offset')
      .optional()
      .isInt({ min: 0 }),
  ],
  reviewController.getProductReviews
);

/**
 * Mark review as helpful
 * POST /api/reviews/:reviewId/helpful
 */
router.post(
  '/:reviewId/helpful',
  [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Invalid review ID'),
  ],
  reviewController.markReviewHelpful
);

/**
 * Report a review
 * POST /api/reviews/:reviewId/report
 */
router.post(
  '/:reviewId/report',
  [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Invalid review ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }),
  ],
  reviewController.reportReview
);

// ============ Admin Routes ============

/**
 * List pending reviews (admin only)
 * GET /api/reviews/admin/pending
 */
router.get(
  '/admin/pending',
  authenticateAdmin,
  [
    query('status')
      .optional()
      .isIn(['pending', 'flagged', 'all']),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('offset')
      .optional()
      .isInt({ min: 0 }),
  ],
  reviewController.listPendingReviews
);

/**
 * Moderate a review (admin only)
 * POST /api/reviews/admin/:reviewId/moderate
 */
router.post(
  '/admin/:reviewId/moderate',
  authenticateAdmin,
  [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Invalid review ID'),
    body('action')
      .isIn(['approve', 'reject', 'respond'])
      .withMessage('Action must be: approve, reject, or respond'),
    body('rejection_reason')
      .if(body('action').equals('reject'))
      .notEmpty()
      .withMessage('Rejection reason required'),
    body('admin_response')
      .if(body('action').equals('respond'))
      .notEmpty()
      .isLength({ max: 1000 })
      .withMessage('Response required and must be under 1000 characters'),
  ],
  reviewController.moderateReview
);

/**
 * Get review statistics (admin only)
 * GET /api/reviews/admin/stats
 */
router.get(
  '/admin/stats',
  authenticateAdmin,
  reviewController.getReviewStats
);

module.exports = router;
