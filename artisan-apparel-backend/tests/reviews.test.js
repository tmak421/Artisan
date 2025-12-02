/**
 * Review Tests
 * ============
 * Tests for review submission and retrieval.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const request = require('supertest');
const app = require('../server');
const { Order, Review } = require('../src/models');

// Mock services
jest.mock('../src/services/decredService', () => ({
  generateAddress: jest.fn().mockResolvedValue('DsTestAddress'),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
}));

jest.mock('../src/services/krakenService', () => ({
  getCurrentPrice: jest.fn().mockResolvedValue(20.50),
}));

jest.mock('../src/services/emailService', () => ({
  sendPaymentPending: jest.fn().mockResolvedValue(true),
}));

describe('Review API', () => {
  let testOrderId;

  // Create a test order before review tests
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/orders/create')
      .send({
        items: [{ product_id: 'test-product', variant_id: 'v1', quantity: 1, price: 50 }],
        customer: { email: 'reviewer@example.com' },
        shipping: { name: 'Test', address1: '123 St', city: 'NYC', zip: '10001' },
        payment_method: 'DCR',
      });
    
    testOrderId = response.body.order_id;
  });

  describe('POST /api/reviews/submit', () => {
    it('should reject review for non-existent order', async () => {
      const response = await request(app)
        .post('/api/reviews/submit')
        .send({
          order_id: 'AA-2024-999999',
          product_id: 'test-product',
          rating: 5,
          review_text: 'Great product!',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject review without rating', async () => {
      const response = await request(app)
        .post('/api/reviews/submit')
        .send({
          order_id: testOrderId,
          product_id: 'test-product',
          review_text: 'Great product!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject rating outside 1-5 range', async () => {
      const response = await request(app)
        .post('/api/reviews/submit')
        .send({
          order_id: testOrderId,
          product_id: 'test-product',
          rating: 6,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject rating of 0', async () => {
      const response = await request(app)
        .post('/api/reviews/submit')
        .send({
          order_id: testOrderId,
          product_id: 'test-product',
          rating: 0,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject review text over 5000 characters', async () => {
      const response = await request(app)
        .post('/api/reviews/submit')
        .send({
          order_id: testOrderId,
          product_id: 'test-product',
          rating: 5,
          review_text: 'a'.repeat(5001),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/:productId', () => {
    it('should return empty reviews for new product', async () => {
      const response = await request(app)
        .get('/api/reviews/new-product-xyz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics.total_reviews).toBe(0);
      expect(response.body.reviews).toEqual([]);
    });

    it('should accept sort parameter', async () => {
      const response = await request(app)
        .get('/api/reviews/test-product?sort=helpful')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/api/reviews/test-product?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it('should reject invalid sort parameter', async () => {
      const response = await request(app)
        .get('/api/reviews/test-product?sort=invalid')
        .expect(400);
    });
  });

  describe('POST /api/reviews/:reviewId/helpful', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .post('/api/reviews/99999/helpful')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid review ID', async () => {
      const response = await request(app)
        .post('/api/reviews/invalid/helpful')
        .expect(400);
    });
  });

  describe('POST /api/reviews/:reviewId/report', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .post('/api/reviews/99999/report')
        .send({ reason: 'Spam' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Endpoints', () => {
    it('should reject pending reviews without API key', async () => {
      const response = await request(app)
        .get('/api/reviews/admin/pending')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject moderation without API key', async () => {
      const response = await request(app)
        .post('/api/reviews/admin/1/moderate')
        .send({ action: 'approve' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject stats without API key', async () => {
      const response = await request(app)
        .get('/api/reviews/admin/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
