-- Khushi's Zone PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  phone VARCHAR(50) DEFAULT '',
  address TEXT DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  state VARCHAR(100) DEFAULT '',
  pincode VARCHAR(20) DEFAULT '',
  google_id VARCHAR(255) DEFAULT NULL,
  avatar TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) DEFAULT NULL,
  verification_token_expires TIMESTAMP DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  sizes VARCHAR(100)[] DEFAULT '{"XS", "S", "M", "L", "XL"}',
  type VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 4.8,
  is_bestseller BOOLEAN DEFAULT FALSE,
  sku VARCHAR(100),
  brand VARCHAR(150),
  material VARCHAR(255),
  care_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  stock_status VARCHAR(50) DEFAULT 'in_stock',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(10) DEFAULT 'M',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_item_size UNIQUE(user_id, item_id, size)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_wishlist_item UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Processing',
  payment_method VARCHAR(50) DEFAULT 'UPI / Card',
  payment_status VARCHAR(50) DEFAULT 'Paid',
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  size VARCHAR(10) DEFAULT 'M'
);

CREATE TABLE IF NOT EXISTS product_media (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── item_colors ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_colors (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_item_color UNIQUE(item_id, color_name)
);

-- ─── item_variants ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_variants (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  color_id INT REFERENCES item_colors(id) ON DELETE SET NULL,
  size VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  stock_quantity INT NOT NULL DEFAULT 0,
  supplier_sku VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_item_color_size UNIQUE(item_id, color_id, size)
);

-- Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL
);
-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_item_colors_item_id       ON item_colors(item_id);
CREATE INDEX IF NOT EXISTS idx_item_variants_item_id     ON item_variants(item_id);
CREATE INDEX IF NOT EXISTS idx_item_variants_color_id    ON item_variants(color_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id  ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id         ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_is_active           ON items(is_active);

-- One user can store many delivery addresses
CREATE TABLE IF NOT EXISTS user_address (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  alternate_phone_number VARCHAR(50) DEFAULT '',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT DEFAULT '',
  landmark VARCHAR(255) DEFAULT '',
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) DEFAULT '',
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  latitude NUMERIC(10,7) DEFAULT NULL,
  longitude NUMERIC(10,7) DEFAULT NULL,
  formatted_address TEXT DEFAULT '',
  address_type VARCHAR(20) NOT NULL DEFAULT 'Home'
    CHECK (address_type IN ('Home', 'Work', 'Other')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_address_user_id ON user_address(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_address_one_default
  ON user_address (user_id)
  WHERE is_default = TRUE;
