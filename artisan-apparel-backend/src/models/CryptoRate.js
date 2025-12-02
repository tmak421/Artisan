/**
 * CryptoRate Model
 * ================
 * Caches cryptocurrency exchange rates to minimize API calls.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../config/database');

class CryptoRate extends Model {
  /**
   * Check if rate is still valid (not stale)
   * @param {number} maxAgeSeconds - Maximum age in seconds
   * @returns {boolean}
   */
  isValid(maxAgeSeconds = 300) {
    const ageMs = Date.now() - new Date(this.fetched_at).getTime();
    return ageMs < maxAgeSeconds * 1000;
  }
  
  /**
   * Get latest rate for a cryptocurrency
   * @param {string} cryptocurrency - Currency code
   * @param {number} maxAgeSeconds - Maximum cache age
   * @returns {Promise<CryptoRate|null>}
   */
  static async getLatestRate(cryptocurrency, maxAgeSeconds = 300) {
    const minFetchTime = new Date(Date.now() - maxAgeSeconds * 1000);
    
    return this.findOne({
      where: {
        cryptocurrency: cryptocurrency.toUpperCase(),
        fetched_at: { [Op.gte]: minFetchTime },
      },
      order: [['fetched_at', 'DESC']],
    });
  }
  
  /**
   * Save a new rate
   * @param {string} cryptocurrency - Currency code
   * @param {number} usdRate - Rate in USD
   * @param {string} source - Rate source (e.g., 'kraken', 'coingecko')
   * @returns {Promise<CryptoRate>}
   */
  static async saveRate(cryptocurrency, usdRate, source = 'api') {
    return this.create({
      cryptocurrency: cryptocurrency.toUpperCase(),
      usd_rate: usdRate,
      source,
      fetched_at: new Date(),
    });
  }
  
  /**
   * Clean up old rates
   * @param {number} keepHours - Hours of history to keep
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanup(keepHours = 24) {
    const cutoff = new Date(Date.now() - keepHours * 60 * 60 * 1000);
    
    return this.destroy({
      where: {
        fetched_at: { [Op.lt]: cutoff },
      },
    });
  }
}

CryptoRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    cryptocurrency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['DCR', 'BTC', 'XMR', 'LTC', 'ETH']],
      },
    },
    
    usd_rate: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Value of 1 unit of crypto in USD',
    },
    
    // Additional rate data
    btc_rate: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: true,
      comment: 'Value of 1 unit in BTC',
    },
    volume_24h: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      comment: '24h trading volume in USD',
    },
    change_24h: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      comment: '24h price change percentage',
    },
    
    // Source tracking
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'api',
      comment: 'Rate data source (kraken, coingecko, etc.)',
    },
    
    fetched_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CryptoRate',
    tableName: 'crypto_rates',
    timestamps: false,
    indexes: [
      { fields: ['cryptocurrency'] },
      { fields: ['fetched_at'] },
      { fields: ['cryptocurrency', 'fetched_at'] },
    ],
  }
);

module.exports = CryptoRate;
