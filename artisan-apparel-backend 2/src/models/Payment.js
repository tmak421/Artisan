/**
 * Payment Model
 * =============
 * Tracks cryptocurrency payment transactions.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Payment extends Model {
  /**
   * Check if payment has expired
   * @returns {boolean}
   */
  isExpired() {
    return new Date() > new Date(this.expires_at);
  }
  
  /**
   * Check if payment has sufficient confirmations
   * @param {number} required - Required confirmations
   * @returns {boolean}
   */
  hasEnoughConfirmations(required) {
    return this.confirmations >= required;
  }
  
  /**
   * Check if payment amount is sufficient
   * @param {number} tolerance - Acceptable underpayment percentage (default 1%)
   * @returns {boolean}
   */
  isAmountSufficient(tolerance = 1) {
    if (!this.received_amount) return false;
    const minAccepted = this.expected_amount * (1 - tolerance / 100);
    return parseFloat(this.received_amount) >= minAccepted;
  }
  
  /**
   * Calculate underpayment/overpayment amount
   * @returns {number} Difference (positive = overpaid, negative = underpaid)
   */
  getPaymentDifference() {
    if (!this.received_amount) return -this.expected_amount;
    return parseFloat(this.received_amount) - parseFloat(this.expected_amount);
  }
  
  /**
   * Get time remaining until expiry
   * @returns {number} Milliseconds remaining (negative if expired)
   */
  getTimeRemaining() {
    return new Date(this.expires_at) - new Date();
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    // Reference to order
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'order_id',
      },
    },
    
    // Cryptocurrency details
    cryptocurrency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['DCR', 'BTC', 'XMR', 'LTC', 'ETH']],
      },
    },
    payment_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    
    // Amount tracking
    expected_amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    received_amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: true,
    },
    
    // USD equivalent at time of payment
    usd_rate: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: true,
      comment: 'Crypto to USD rate at payment creation',
    },
    
    // Transaction details
    transaction_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    confirmations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    
    // Block information
    block_height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    block_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Status tracking
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'detected', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'expired', 'refunded']],
      },
    },
    
    // Timestamps
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment was first detected on chain',
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment reached required confirmations',
    },
    
    // For refunds
    refund_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refund_tx_hash: {
      type: DataTypes.STRING(255),
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
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['payment_address'] },
      { fields: ['status'] },
      { fields: ['transaction_hash'] },
      { fields: ['expires_at'] },
      { fields: ['cryptocurrency'] },
    ],
  }
);

module.exports = Payment;
