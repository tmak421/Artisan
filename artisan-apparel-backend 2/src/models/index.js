/**
 * Models Index
 * ============
 * Central export for all Sequelize models with associations.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { sequelize, Sequelize } = require('../config/database');

// Import models
const Order = require('./Order');
const Payment = require('./Payment');
const Review = require('./Review');
const CryptoRate = require('./CryptoRate');

// Define associations
// -------------------

// Order has many Payments
Order.hasMany(Payment, {
  foreignKey: 'order_id',
  sourceKey: 'order_id',
  as: 'payments',
});

Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  targetKey: 'order_id',
  as: 'order',
});

// Order has many Reviews
Order.hasMany(Review, {
  foreignKey: 'order_id',
  sourceKey: 'order_id',
  as: 'reviews',
});

Review.belongsTo(Order, {
  foreignKey: 'order_id',
  targetKey: 'order_id',
  as: 'order',
});

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  Order,
  Payment,
  Review,
  CryptoRate,
};
