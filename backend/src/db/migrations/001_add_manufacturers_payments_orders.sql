-- Migration: Add manufacturer, payment details, and enhanced order management
BEGIN;

-- Create payment_details table
CREATE TABLE IF NOT EXISTS payment_details (
  id SERIAL PRIMARY KEY,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'upi', 'other')),
  account_holder_name VARCHAR(255),
  bank_account_number VARCHAR(255),
  ifsc_code VARCHAR(20),
  upi_id VARCHAR(255),
  settlement_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create manufacturer_details table
CREATE TABLE IF NOT EXISTS manufacturer_details (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  personal_number VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  shop_type VARCHAR(100) NOT NULL,
  cod_allowed BOOLEAN DEFAULT TRUE,
  payment_details_id INT REFERENCES payment_details(id) ON DELETE RESTRICT,
  pickup_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add manufacturer_id to items table
ALTER TABLE items 
  ADD COLUMN IF NOT EXISTS manufacturer_id INT REFERENCES manufacturer_details(id) ON DELETE RESTRICT;

-- Create index for manufacturer queries
CREATE INDEX IF NOT EXISTS idx_items_manufacturer_id ON items(manufacturer_id);

-- Create or update orders table structure
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS address_id INT REFERENCES user_address(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'COD',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update order_items to have snapshots
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS manufacturer_id INT REFERENCES manufacturer_details(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS line_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create order_fulfillments table for multi-manufacturer orders
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  manufacturer_id INT REFERENCES manufacturer_details(id) ON DELETE RESTRICT,
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(100),
  courier_name VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  actor_type VARCHAR(20) DEFAULT 'system', -- customer, admin, manufacturer, system
  actor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

COMMIT;
