/**
 * Order Model
 * ===========
 * Represents customer orders in the system.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Order extends Model {
  /**
   * Check if order is in a state that allows cancellation
   * @returns {boolean}
   */
  canBeCancelled() {
    return ['pending_payment', 'pending'].includes(this.order_status);
  }
  
  /**
   * Check if order has been paid
   * @returns {boolean}
   */
  isPaid() {
    return this.payment_status === 'confirmed';
  }
  
  /**
   * Check if order is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.order_status === 'delivered';
  }
  
  /**
   * Get order summary for customer display
   * @returns {Object}
   */
  getSummary() {
    return {
      orderId: this.order_id,
      status: this.order_status,
      paymentStatus: this.payment_status,
      total: this.total_usd,
      cryptocurrency: this.crypto_currency,
      createdAt: this.created_at,
      tracking: this.tracking_number ? {
        number: this.tracking_number,
        url: this.tracking_url,
      } : null,
    };
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    // Unique order identifier (AA-YYYY-XXXXXX format)
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        is: /^AA-\d{4}-\d{6}$/,
      },
    },
    
    // External order IDs
    shopify_order_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    printful_order_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    
    // Customer information
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Shipping address (stored as JSON)
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        hasRequiredFields(value) {
          const required = ['name', 'address1', 'city', 'country'];
          for (const field of required) {
            if (!value[field]) {
              throw new Error(`Shipping address missing required field: ${field}`);
            }
          }
        },
      },
    },
    
    // Order items (stored as JSON array)
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Items must be an array');
          }
        },
      },
    },
    
    // Pricing
    total_usd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    
    // Cryptocurrency payment details
    crypto_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['DCR', 'BTC', 'XMR', 'LTC', 'ETH']],
      },
    },
    crypto_amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    payment_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    
    // Payment status
    payment_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'expired', 'refunded']],
      },
    },
    transaction_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Order fulfillment status
    order_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending_payment',
      validate: {
        isIn: [['pending_payment', 'paid', 'production', 'shipped', 'delivered', 'cancelled', 'refunded']],
      },
    },
    
    // Shipping tracking
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tracking_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    carrier: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    
    // Metadata
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_id'], unique: true },
      { fields: ['customer_email'] },
      { fields: ['payment_status'] },
      { fields: ['order_status'] },
      { fields: ['shopify_order_id'] },
      { fields: ['printful_order_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = Order;
