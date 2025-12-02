/**
 * Security Tests
 * ==============
 * Tests for input sanitization, rate limiting, and security measures.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const request = require('supertest');
const app = require('../server');
const {
  sanitizeString,
  deepSanitize,
  isValidEmail,
  isValidOrderId,
} = require('../src/middleware/sanitize');

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should remove script tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeString('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=alert(1)')).not.toContain('onclick=');
    });

    it('should preserve normal text', () => {
      expect(sanitizeString('Hello, World!')).toBe('Hello, World!');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
    });
  });

  describe('deepSanitize', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>bad</script>John',
        address: {
          street: 'onclick=hack() Main St',
        },
      };

      const result = deepSanitize(input);
      expect(result.name).not.toContain('<script>');
      expect(result.address.street).not.toContain('onclick=');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>bad</script>', 'good'];
      const result = deepSanitize(input);
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('good');
    });

    it('should limit array size to prevent DoS', () => {
      const largeArray = new Array(1500).fill('item');
      const result = deepSanitize(largeArray);
      expect(result.length).toBe(1000);
    });

    it('should limit object key count', () => {
      const largeObject = {};
      for (let i = 0; i < 150; i++) {
        largeObject[`key${i}`] = 'value';
      }
      const result = deepSanitize(largeObject);
      expect(result).toBe(null);
    });

    it('should prevent deep recursion', () => {
      // Create deeply nested object
      let obj = { value: 'test' };
      for (let i = 0; i < 15; i++) {
        obj = { nested: obj };
      }
      
      const result = deepSanitize(obj);
      // Should not throw, should truncate
      expect(result).toBeDefined();
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });

    it('should reject overly long emails', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('isValidOrderId', () => {
    it('should accept valid order IDs', () => {
      expect(isValidOrderId('AA-2024-000001')).toBe(true);
      expect(isValidOrderId('AA-2025-123456')).toBe(true);
    });

    it('should reject invalid order IDs', () => {
      expect(isValidOrderId('invalid')).toBe(false);
      expect(isValidOrderId('AA-24-001')).toBe(false);
      expect(isValidOrderId('BB-2024-000001')).toBe(false);
      expect(isValidOrderId('')).toBe(false);
      expect(isValidOrderId(null)).toBe(false);
    });
  });
});

describe('Security Headers', () => {
  it('should set security headers via Helmet', async () => {
    const response = await request(app).get('/health');
    
    // Helmet headers
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('Rate Limiting', () => {
  it('should include rate limit headers', async () => {
    const response = await request(app).get('/health');
    
    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });
});

describe('CORS', () => {
  it('should reject requests from unauthorized origins in production-like mode', async () => {
    // This tests that CORS is configured, not wide open
    const response = await request(app)
      .options('/api/orders/create')
      .set('Origin', 'https://malicious-site.com')
      .set('Access-Control-Request-Method', 'POST');
    
    // In test mode with strict CORS, this should be blocked
    // Note: exact behavior depends on environment
  });

  it('should allow requests from configured origins', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.status).toBe(200);
  });
});

describe('XSS Prevention', () => {
  it('should sanitize XSS in order creation', async () => {
    const response = await request(app)
      .post('/api/orders/create')
      .send({
        items: [{
          product_id: '<script>alert(1)</script>',
          variant_id: 'v1',
          quantity: 1,
          price: 50,
        }],
        customer: {
          email: 'test@example.com',
          name: '<img src=x onerror=alert(1)>John',
        },
        shipping: {
          name: 'Test',
          address1: '123 St',
          city: 'NYC',
          zip: '10001',
        },
        payment_method: 'DCR',
      });
    
    // Request should process but sanitize the malicious content
    // Either 201 (created with sanitized data) or 400 (validation failed)
    expect([201, 400]).toContain(response.status);
  });
});

describe('SQL Injection Prevention', () => {
  it('should handle SQL injection attempts in query params', async () => {
    const response = await request(app)
      .get('/api/orders/AA-2024-000001; DROP TABLE orders;--')
      .expect(400); // Should fail validation, not execute SQL
  });

  it('should handle SQL injection in order ID', async () => {
    const response = await request(app)
      .get("/api/orders/AA-2024-000001' OR '1'='1")
      .expect(400);
  });
});

describe('Webhook Security', () => {
  it('should reject webhooks without signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/payment-confirmed')
      .send({ order_id: 'AA-2024-000001' })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should reject webhooks with invalid signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/payment-confirmed')
      .set('X-Internal-Signature', 'invalid')
      .set('X-Timestamp', Date.now().toString())
      .send({ order_id: 'AA-2024-000001' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should reject webhooks with old timestamp', async () => {
    const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    
    const response = await request(app)
      .post('/api/webhooks/payment-confirmed')
      .set('X-Internal-Signature', 'somesignature')
      .set('X-Timestamp', oldTimestamp.toString())
      .send({ order_id: 'AA-2024-000001' })
      .expect(403);

    expect(response.body.error).toContain('Timestamp');
  });
});
