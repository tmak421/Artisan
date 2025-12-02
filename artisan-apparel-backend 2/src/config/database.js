/**
 * Database Configuration
 * ======================
 * Sequelize ORM configuration for PostgreSQL.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('../utils/logger');

// Create Sequelize instance with connection pooling
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.isDevelopment ? (msg) => logger.debug(msg) : false,
    
    // Connection pool configuration
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle,
    },
    
    // SSL configuration for production
    dialectOptions: config.database.ssl ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    
    // Define options
    define: {
      timestamps: true,
      underscored: true, // Use snake_case for columns
      freezeTableName: true, // Don't pluralize table names
    },
    
    // Timezone
    timezone: '+00:00', // UTC
  }
);

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection success status
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
}

/**
 * Sync database models (use with caution in production)
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
async function syncDatabase(options = {}) {
  try {
    if (config.isProduction && !options.force) {
      logger.warn('Database sync skipped in production. Use migrations instead.');
      return;
    }
    
    await sequelize.sync(options);
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Database sync failed:', error);
    throw error;
  }
}

/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
async function closeConnection() {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
