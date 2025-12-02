/**
 * Review Model
 * ============
 * Customer product reviews tied to verified purchases.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Review extends Model {
  /**
   * Check if review is approved and visible
   * @returns {boolean}
   */
  isVisible() {
    return this.status === 'approved';
  }
  
  /**
   * Get display name (respects anonymity preference)
   * @returns {string}
   */
  getDisplayName() {
    if (!this.reviewer_name || this.is_anonymous) {
      return 'Anonymous';
    }
    // Show first name and last initial
    const parts = this.reviewer_name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  }
  
  /**
   * Get formatted review for public display
   * @returns {Object}
   */
  toPublicJSON() {
    return {
      id: this.id,
      rating: this.rating,
      title: this.review_title,
      text: this.review_text,
      reviewer: this.getDisplayName(),
      verified: this.verified_purchase,
      helpful: this.helpful_votes,
      date: this.created_at,
      response: this.admin_response ? {
        text: this.admin_response,
        date: this.responded_at,
      } : null,
    };
  }
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    // Reference to order (for verified purchase)
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'order_id',
      },
    },
    
    // Product identification
    product_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Product SKU or identifier',
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    variant_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Size, color, etc.',
    },
    
    // Review content
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    review_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 5000],
      },
    },
    
    // Reviewer information
    reviewer_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    reviewer_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // Verification
    verified_purchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'True if review is tied to a confirmed order',
    },
    
    // Moderation
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected', 'flagged']],
      },
    },
    rejection_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    
    // Admin response
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    responded_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    
    // Engagement metrics
    helpful_votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    reported_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    
    // Photos (URLs stored as JSON array)
    photos: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    
    // Timestamps
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] },
      { fields: ['status'] },
      { fields: ['rating'] },
      { fields: ['verified_purchase'] },
      { fields: ['created_at'] },
      // Composite index for product reviews
      { fields: ['product_id', 'status', 'rating'] },
    ],
  }
);

module.exports = Review;
