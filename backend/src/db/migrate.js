/**
 * migrate.js — Safe, repeatable database migration for KhushiZone product upgrade.
 *
 * Adds new columns to existing tables (using ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
 * and migrates existing item.image_url data into product_media without duplicating records.
 *
 * Usage:  node src/db/migrate.js
 */

"use strict";

const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  console.log("🔌 Connected to PostgreSQL. Starting migration...\n");

  try {
    await client.query("BEGIN");

    // ── 1. users: add is_admin ─────────────────────────────────────────────
    console.log("→ users: adding is_admin column...");
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    // ── 2. items: add enriched product columns ─────────────────────────────
    console.log("→ items: adding new product columns...");
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS sku              VARCHAR(100);`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS brand            VARCHAR(150);`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS material         VARCHAR(255);`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS care_instructions TEXT;`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT TRUE;`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS stock_status     VARCHAR(50) DEFAULT 'in_stock';`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    // ── 3. item_colors table ───────────────────────────────────────────────
    console.log("→ Creating item_colors table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS item_colors (
        id         SERIAL PRIMARY KEY,
        item_id    INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        color_name VARCHAR(100) NOT NULL,
        hex_code   VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_item_color UNIQUE(item_id, color_name)
      );
    `);

    // ── 4. item_variants table ─────────────────────────────────────────────
    console.log("→ Creating item_variants table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS item_variants (
        id             SERIAL PRIMARY KEY,
        item_id        INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        color_id       INT REFERENCES item_colors(id) ON DELETE SET NULL,
        size           VARCHAR(50) NOT NULL,
        sku            VARCHAR(100),
        price          NUMERIC(10,2),
        original_price NUMERIC(10,2),
        stock_quantity INT NOT NULL DEFAULT 0,
        supplier_sku   VARCHAR(100),
        is_active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_item_color_size UNIQUE(item_id, color_id, size)
      );
    `);

    // ── 5. Indexes ─────────────────────────────────────────────────────────
    console.log("→ Creating indexes...");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_item_colors_item_id      ON item_colors(item_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_item_variants_item_id    ON item_variants(item_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_item_variants_color_id   ON item_variants(color_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_items_category_id        ON items(category_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_items_is_active          ON items(is_active);`);

    // ── 6. Migrate items.image_url → product_media ─────────────────────────
    //    Only migrate image_url values that are not already in product_media
    //    for that product. Skips NULL / empty strings.
    console.log("→ Migrating existing items.image_url into product_media...");
    const migrateRes = await client.query(`
      INSERT INTO product_media (product_id, media_type, media_url, public_id, alt_text, sort_order, is_primary)
      SELECT
        i.id          AS product_id,
        'image'       AS media_type,
        i.image_url   AS media_url,
        -- Use a stable synthetic public_id so re-runs are idempotent via ON CONFLICT
        'legacy/item_' || i.id AS public_id,
        i.name        AS alt_text,
        0             AS sort_order,
        TRUE          AS is_primary
      FROM items i
      WHERE i.image_url IS NOT NULL
        AND i.image_url <> ''
        -- Only insert if no media record exists for this product yet
        AND NOT EXISTS (
          SELECT 1 FROM product_media pm
          WHERE pm.product_id = i.id
        )
      RETURNING id, product_id;
    `);
    console.log(`   ✅ Migrated ${migrateRes.rowCount} legacy image_url(s) into product_media.`);

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Migration failed — rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
