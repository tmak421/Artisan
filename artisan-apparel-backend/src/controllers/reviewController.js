/**
 * Review Controller
 * =================
 * Handles product review submission and retrieval.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Order, Review } = require('../models');
const logger = require('../utils/logger');

/**
 * Submit a review
 * POST /api/reviews/submit
 */
async function submitReview(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    
    const {
      order_id,
      product_id,
      rating,
      review_title,
      review_text,
      reviewer_name,
      is_anonymous = false,
    } = req.body;
    
    // Verify order exists and is delivered
    const order = await Order.findOne({ where: { order_id } });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
    
    if (order.order_status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Reviews can only be submitted for delivered orders',
      });
    }
    
    // Check if product was in the order
    const orderItems = order.items || [];
    const productInOrder = orderItems.some(item => 
      item.product_id === product_id || item.variant_id === product_id
    );
    
    // Find the product name from the order
    const orderItem = orderItems.find(item => 
      item.product_id === product_id || item.variant_id === product_id
    );
    const productName = orderItem?.name || product_id;
    
    // Check for existing review
    const existingReview = await Review.findOne({
      where: { order_id, product_id },
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'A review for this product has already been submitted',
      });
    }
    
    // Create review
    const review = await Review.create({
      order_id,
      product_id,
      product_name: productName,
      rating,
      review_title: review_title || null,
      review_text: review_text || null,
      reviewer_name: reviewer_name || order.customer_name,
      reviewer_email: order.customer_email,
      is_anonymous,
      verified_purchase: productInOrder,
      status: 'pending', // Requires moderation
    });
    
    logger.info('Review submitted', {
      orderId: order_id,
      productId: product_id,
      rating,
      verified: productInOrder,
    });
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and pending approval',
      review: {
        id: review.id,
        rating: review.rating,
        verified_purchase: review.verified_purchase,
      },
    });
  } catch (error) {
    logger.error('Review submission failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
    });
  }
}

/**
 * Get reviews for a product
 * GET /api/reviews/:productId
 */
async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const { sort = 'recent', limit = 20, offset = 0 } = req.query;
    
    // Build sort order
    let orderBy;
    switch (sort) {
      case 'helpful':
        orderBy = [['helpful_votes', 'DESC'], ['created_at', 'DESC']];
        break;
      case 'rating_high':
        orderBy = [['rating', 'DESC'], ['created_at', 'DESC']];
        break;
      case 'rating_low':
        orderBy = [['rating', 'ASC'], ['created_at', 'DESC']];
        break;
      case 'recent':
      default:
        orderBy = [['created_at', 'DESC']];
    }
    
    // Get approved reviews only
    const reviews = await Review.findAndCountAll({
      where: {
        product_id: productId,
        status: 'approved',
      },
      order: orderBy,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    
    // Calculate rating statistics
    const stats = await Review.findAll({
      where: {
        product_id: productId,
        status: 'approved',
      },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'total_reviews'],
      ],
      raw: true,
    });
    
    // Get rating distribution
    const distribution = await Review.findAll({
      where: {
        product_id: productId,
        status: 'approved',
      },
      attributes: [
        'rating',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count'],
      ],
      group: ['rating'],
      raw: true,
    });
    
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
      ratingDist[d.rating] = parseInt(d.count, 10);
    });
    
    res.json({
      success: true,
      product_id: productId,
      statistics: {
        average_rating: parseFloat(stats[0]?.average_rating || 0).toFixed(1),
        total_reviews: parseInt(stats[0]?.total_reviews || 0, 10),
        rating_distribution: ratingDist,
      },
      reviews: reviews.rows.map(r => r.toPublicJSON()),
      total: reviews.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    logger.error('Get product reviews failed', {
      productId: req.params.productId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
    });
  }
}

/**
 * Mark review as helpful
 * POST /api/reviews/:reviewId/helpful
 */
async function markReviewHelpful(req, res) {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findByPk(reviewId);
    
    if (!review || review.status !== 'approved') {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }
    
    await review.increment('helpful_votes');
    
    res.json({
      success: true,
      helpful_votes: review.helpful_votes + 1,
    });
  } catch (error) {
    logger.error('Mark review helpful failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to mark review as helpful',
    });
  }
}

/**
 * Report a review
 * POST /api/reviews/:reviewId/report
 */
async function reportReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const review = await Review.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }
    
    await review.increment('reported_count');
    
    // Auto-flag if too many reports
    if (review.reported_count >= 5) {
      await review.update({ status: 'flagged' });
    }
    
    logger.info('Review reported', {
      reviewId,
      reason,
      reportCount: review.reported_count + 1,
    });
    
    res.json({
      success: true,
      message: 'Review reported for moderation',
    });
  } catch (error) {
    logger.error('Report review failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to report review',
    });
  }
}

/**
 * List reviews for moderation (admin)
 * GET /api/reviews/admin/pending
 */
async function listPendingReviews(req, res) {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status === 'pending') {
      where.status = 'pending';
    } else if (status === 'flagged') {
      where.status = 'flagged';
    } else if (status === 'all') {
      // No filter
    } else {
      where.status = status;
    }
    
    const reviews = await Review.findAndCountAll({
      where,
      order: [['created_at', 'ASC']], // Oldest first for moderation
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [{
        model: Order,
        as: 'order',
        attributes: ['customer_email', 'order_status'],
      }],
    });
    
    res.json({
      success: true,
      reviews: reviews.rows,
      total: reviews.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    logger.error('List pending reviews failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list reviews',
    });
  }
}

/**
 * Moderate a review (admin)
 * POST /api/reviews/admin/:reviewId/moderate
 */
async function moderateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { action, rejection_reason, admin_response } = req.body;
    
    const review = await Review.findByPk(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }
    
    const updates = {};
    
    switch (action) {
      case 'approve':
        updates.status = 'approved';
        updates.approved_at = new Date();
        break;
      case 'reject':
        updates.status = 'rejected';
        updates.rejection_reason = rejection_reason;
        break;
      case 'respond':
        updates.admin_response = admin_response;
        updates.responded_at = new Date();
        updates.responded_by = req.user?.name || 'Admin';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: approve, reject, or respond',
        });
    }
    
    await review.update(updates);
    
    logger.info('Review moderated', {
      reviewId,
      action,
    });
    
    res.json({
      success: true,
      message: `Review ${action}d successfully`,
    });
  } catch (error) {
    logger.error('Moderate review failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to moderate review',
    });
  }
}

/**
 * Get review statistics (admin)
 * GET /api/reviews/admin/stats
 */
async function getReviewStats(req, res) {
  try {
    const stats = await Review.findAll({
      attributes: [
        'status',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });
    
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
    };
    
    stats.forEach(s => {
      statusCounts[s.status] = parseInt(s.count, 10);
    });
    
    // Get average rating across all approved reviews
    const avgRating = await Review.findOne({
      where: { status: 'approved' },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average'],
      ],
      raw: true,
    });
    
    res.json({
      success: true,
      statistics: {
        by_status: statusCounts,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        average_rating: parseFloat(avgRating?.average || 0).toFixed(2),
      },
    });
  } catch (error) {
    logger.error('Get review stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get review statistics',
    });
  }
}

module.exports = {
  submitReview,
  getProductReviews,
  markReviewHelpful,
  reportReview,
  listPendingReviews,
  moderateReview,
  getReviewStats,
};
