-- ==============================================================================
-- ARTISAN APPAREL DATABASE SCHEMA
-- ==============================================================================
-- PostgreSQL 15.x
-- Run this migration to create all required tables
-- ==============================================================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- ORDERS TABLE
-- ==============================================================================
-- Stores all customer orders with payment and shipping details

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  
  -- Unique order identifier (format: AA-YYYY-XXXXXX)
  order_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- External order IDs from integrated services
  shopify_order_id VARCHAR(50),
  printful_order_id VARCHAR(50),
  
  -- Customer information
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  
  -- Shipping address stored as JSON
  shipping_address JSONB NOT NULL,
  
  -- Order items stored as JSON array
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Order total in USD
  total_usd DECIMAL(10,2) NOT NULL CHECK (total_usd >= 0),
  
  -- Cryptocurrency payment details
  crypto_currency VARCHAR(10) NOT NULL,
  crypto_amount DECIMAL(20,8) NOT NULL CHECK (crypto_amount >= 0),
  payment_address VARCHAR(255) NOT NULL,
  
  -- Payment status
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'expired', 'refunded')),
  transaction_hash VARCHAR(255),
  
  -- Order fulfillment status
  order_status VARCHAR(20) DEFAULT 'pending_payment'
    CHECK (order_status IN ('pending_payment', 'paid', 'production', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Shipping tracking information
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  carrier VARCHAR(50),
  
  -- Additional fields
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_printful_id ON orders(printful_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ==============================================================================
-- PAYMENTS TABLE
-- ==============================================================================
-- Tracks cryptocurrency payment transactions

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  
  -- Reference to order
  order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  
  -- Cryptocurrency details
  cryptocurrency VARCHAR(10) NOT NULL
    CHECK (cryptocurrency IN ('DCR', 'BTC', 'XMR', 'LTC', 'ETH')),
  payment_address VARCHAR(255) NOT NULL,
  
  -- Amount tracking
  expected_amount DECIMAL(20,8) NOT NULL CHECK (expected_amount >= 0),
  received_amount DECIMAL(20,8),
  usd_rate DECIMAL(20,8),
  
  -- Transaction details
  transaction_hash VARCHAR(255),
  confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
  block_height INTEGER,
  block_hash VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'detected', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'expired', 'refunded')),
  
  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Refund information
  refund_address VARCHAR(255),
  refund_tx_hash VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_address ON payments(payment_address);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_cryptocurrency ON payments(cryptocurrency);

-- ==============================================================================
-- REVIEWS TABLE
-- ==============================================================================
-- Customer product reviews tied to verified purchases

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  
  -- Reference to order
  order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  
  -- Product identification
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_info VARCHAR(255),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title VARCHAR(200),
  review_text TEXT,
  
  -- Reviewer information
  reviewer_name VARCHAR(100),
  reviewer_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Verification
  verified_purchase BOOLEAN DEFAULT TRUE,
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  rejection_reason VARCHAR(500),
  
  -- Admin response
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by VARCHAR(100),
  
  -- Engagement metrics
  helpful_votes INTEGER DEFAULT 0 CHECK (helpful_votes >= 0),
  reported_count INTEGER DEFAULT 0 CHECK (reported_count >= 0),
  
  -- Photos (URLs as JSON array)
  photos JSONB DEFAULT '[]',
  
  -- Timestamps
  approved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status_rating ON reviews(product_id, status, rating);

-- ==============================================================================
-- CRYPTO RATES TABLE
-- ==============================================================================
-- Caches cryptocurrency exchange rates

CREATE TABLE IF NOT EXISTS crypto_rates (
  id SERIAL PRIMARY KEY,
  
  -- Currency
  cryptocurrency VARCHAR(10) NOT NULL
    CHECK (cryptocurrency IN ('DCR', 'BTC', 'XMR', 'LTC', 'ETH')),
  
  -- Rate in USD
  usd_rate DECIMAL(20,8) NOT NULL CHECK (usd_rate >= 0),
  
  -- Additional rate data
  btc_rate DECIMAL(20,8),
  volume_24h DECIMAL(20,2),
  change_24h DECIMAL(10,4),
  
  -- Source tracking
  source VARCHAR(50) NOT NULL DEFAULT 'api',
  
  -- Timestamp
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crypto_rates table
CREATE INDEX IF NOT EXISTS idx_crypto_rates_currency ON crypto_rates(cryptocurrency);
CREATE INDEX IF NOT EXISTS idx_crypto_rates_fetched_at ON crypto_rates(fetched_at);
CREATE INDEX IF NOT EXISTS idx_crypto_rates_currency_fetched ON crypto_rates(cryptocurrency, fetched_at);

-- ==============================================================================
-- TRIGGER: Update updated_at timestamp
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- SAMPLE DATA (Development only)
-- ==============================================================================
-- Uncomment to insert test data

/*
INSERT INTO orders (
  order_id, customer_email, customer_name, shipping_address, items,
  total_usd, crypto_currency, crypto_amount, payment_address
) VALUES (
  'AA-2024-000001',
  'test@example.com',
  'Test Customer',
  '{"name": "Test Customer", "address1": "123 Test St", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}',
  '[{"product_id": "hoodie-001", "variant_id": 4017, "name": "Cypherpunk Hoodie - Large", "quantity": 1, "price": 128.00}]',
  128.00,
  'DCR',
  6.234567,
  'DsaB7K9xV4m...'
);
*/

-- ==============================================================================
-- GRANT PERMISSIONS (adjust as needed)
-- ==============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO artisan_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO artisan_user;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
