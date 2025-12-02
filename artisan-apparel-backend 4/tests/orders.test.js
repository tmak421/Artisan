/**
 * Order Tests
 * ===========
 * Unit and integration tests for order functionality.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const request = require('supertest');
const app = require('../server');
const { Order, Payment } = require('../src/models');
const { generateOrderId } = require('../src/utils/crypto');

// Mock external services
jest.mock('../src/services/decredService', () => ({
  generateAddress: jest.fn().mockResolvedValue('DsTestAddress123456789'),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  checkPayment: jest.fn().mockResolvedValue({ received: 0, pending: 0 }),
}));

jest.mock('../src/services/krakenService', () => ({
  getCurrentPrice: jest.fn().mockResolvedValue(20.50),
  isConfigured: jest.fn().mockReturnValue(false),
}));

jest.mock('../src/services/printfulService', () => ({
  createOrder: jest.fn().mockResolvedValue({ id: 12345, status: 'pending' }),
}));

jest.mock('../src/services/emailService', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  sendPaymentPending: jest.fn().mockResolvedValue(true),
  sendShippingNotification: jest.fn().mockResolvedValue(true),
}));

describe('Order API', () => {
  describe('POST /api/orders/create', () => {
    const validOrderData = {
      items: [
        {
          product_id: 'hoodie-001',
          variant_id: '4017',
          quantity: 1,
          price: 128.00,
          name: 'Cypherpunk Hoodie - Large',
        },
      ],
      customer: {
        email: 'test@example.com',
        name: 'Test Customer',
      },
      shipping: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      payment_method: 'DCR',
    };

    it('should create an order with valid data', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send(validOrderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order_id).toMatch(/^AA-\d{4}-\d{6}$/);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.cryptocurrency).toBe('DCR');
      expect(response.body.payment.address).toBeDefined();
      expect(response.body.qr_code).toBeDefined();
    });

    it('should reject order without items', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send({ ...validOrderData, items: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject order without customer email', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send({ ...validOrderData, customer: { name: 'Test' } })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject unsupported payment method', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send({ ...validOrderData, payment_method: 'DOGE' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should return order status for valid order', async () => {
      // First create an order
      const createResponse = await request(app)
        .post('/api/orders/create')
        .send({
          items: [{ product_id: 'test', variant_id: 'v1', quantity: 1, price: 50 }],
          customer: { email: 'test@example.com' },
          shipping: { name: 'Test', address1: '123 St', city: 'NYC', zip: '10001' },
          payment_method: 'DCR',
        });

      const orderId = createResponse.body.order_id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order.order_id).toBe(orderId);
      expect(response.body.order.status).toBe('pending_payment');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/AA-2024-999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid order ID format', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .expect(400);
    });
  });
});

describe('Utility Functions', () => {
  describe('generateOrderId', () => {
    it('should generate order ID in correct format', () => {
      const orderId = generateOrderId();
      expect(orderId).toMatch(/^AA-\d{4}-\d{6}$/);
    });

    it('should generate unique order IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateOrderId());
      }
      expect(ids.size).toBe(1000);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('healthy');
  });

  it('should return API version on /api/health', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.api_version).toBeDefined();
  });
});
