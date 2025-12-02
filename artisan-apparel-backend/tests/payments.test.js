/**
 * Payment Tests
 * =============
 * Tests for payment functionality and crypto integration.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const request = require('supertest');
const app = require('../server');

// Mock Kraken service
jest.mock('../src/services/krakenService', () => ({
  getCurrentPrice: jest.fn().mockResolvedValue(20.50),
  isConfigured: jest.fn().mockReturnValue(true),
  getBalances: jest.fn().mockResolvedValue({ DCR: 10.5, BTC: 0.05 }),
  convertToUSD: jest.fn().mockResolvedValue({ success: true, txIds: ['tx123'] }),
}));

// Mock Decred service
jest.mock('../src/services/decredService', () => ({
  generateAddress: jest.fn().mockResolvedValue('DsTestAddress123456789'),
  checkPayment: jest.fn().mockResolvedValue({
    received: 0,
    pending: 0,
    total: 0,
    expected: 5.0,
    isComplete: false,
    isPending: false,
  }),
  getBalance: jest.fn().mockResolvedValue({
    confirmed: 10.5,
    unconfirmed: 0.5,
    total: 11.0,
  }),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
}));

describe('Payment API', () => {
  describe('GET /api/rates/:cryptocurrency', () => {
    it('should return DCR exchange rate', async () => {
      const response = await request(app)
        .get('/api/rates/DCR')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cryptocurrency).toBe('DCR');
      expect(response.body.usd_rate).toBe(20.50);
      expect(response.body.last_updated).toBeDefined();
    });

    it('should return BTC exchange rate', async () => {
      const response = await request(app)
        .get('/api/rates/BTC')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cryptocurrency).toBe('BTC');
    });

    it('should be case insensitive', async () => {
      const response = await request(app)
        .get('/api/rates/dcr')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cryptocurrency).toBe('DCR');
    });

    it('should reject unsupported cryptocurrency', async () => {
      const response = await request(app)
        .get('/api/rates/DOGE')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/:orderId/status', () => {
    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/payments/AA-2024-999999/status')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid order ID format', async () => {
      const response = await request(app)
        .get('/api/payments/invalid-order/status')
        .expect(400);
    });
  });

  describe('Admin Endpoints (require API key)', () => {
    it('should reject balance request without API key', async () => {
      const response = await request(app)
        .get('/api/payments/balances')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('API key');
    });

    it('should reject convert request without API key', async () => {
      const response = await request(app)
        .post('/api/payments/convert')
        .send({ cryptocurrency: 'DCR', amount: 5.0 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject withdrawal request without API key', async () => {
      const response = await request(app)
        .post('/api/payments/withdraw')
        .send({ amount: 100 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Crypto Utilities', () => {
  const { 
    formatCryptoAmount, 
    calculateCryptoAmount,
    validateCryptoAddress,
    validateTxHash,
  } = require('../src/utils/crypto');

  describe('formatCryptoAmount', () => {
    it('should format DCR with 8 decimals', () => {
      expect(formatCryptoAmount(1.23456789, 'DCR')).toBe('1.23456789');
    });

    it('should format BTC with 8 decimals', () => {
      expect(formatCryptoAmount(0.001, 'BTC')).toBe('0.00100000');
    });

    it('should handle XMR with 12 decimals', () => {
      expect(formatCryptoAmount(1.5, 'XMR')).toBe('1.500000000000');
    });
  });

  describe('calculateCryptoAmount', () => {
    it('should calculate crypto amount from USD', () => {
      const amount = calculateCryptoAmount(100, 20, 0); // $100, $20/crypto, 0% markup
      expect(amount).toBe(5);
    });

    it('should apply markup percentage', () => {
      const amount = calculateCryptoAmount(100, 20, 1); // 1% markup
      expect(amount).toBeCloseTo(5.05, 2);
    });
  });

  describe('validateCryptoAddress', () => {
    it('should validate DCR mainnet address', () => {
      expect(validateCryptoAddress('DsaB7K9xV4mWj1234567890123456789012', 'DCR')).toBe(true);
    });

    it('should validate DCR testnet address', () => {
      expect(validateCryptoAddress('TsaB7K9xV4mWj1234567890123456789012', 'DCR')).toBe(true);
    });

    it('should reject invalid DCR address', () => {
      expect(validateCryptoAddress('invalid', 'DCR')).toBe(false);
    });

    it('should validate BTC legacy address', () => {
      expect(validateCryptoAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'BTC')).toBe(true);
    });

    it('should validate BTC segwit address', () => {
      expect(validateCryptoAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'BTC')).toBe(true);
    });
  });

  describe('validateTxHash', () => {
    it('should validate 64-char hex transaction hash', () => {
      const hash = 'a'.repeat(64);
      expect(validateTxHash(hash, 'DCR')).toBe(true);
    });

    it('should reject short hash', () => {
      expect(validateTxHash('abc123', 'DCR')).toBe(false);
    });

    it('should reject non-hex characters', () => {
      expect(validateTxHash('g'.repeat(64), 'DCR')).toBe(false);
    });
  });
});
