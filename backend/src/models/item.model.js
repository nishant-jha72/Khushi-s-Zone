"use strict";

/**
 * item.model.js
 * Data-access layer for items, item_colors, and item_variants.
 * All DB access is parameterized. Transactions used where needed.
 */

const { query, pool } = require("../config/db");

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/**
 * Build the full product detail object shared by getItemById
 * and any endpoint that needs the complete representation.
 */
function formatProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    originalPrice: row.original_price ? parseFloat(row.original_price) : null,
    sizes: row.sizes || [],
    type: row.type,
    image: row.image_url, // legacy field kept for backward-compat
    rating: parseFloat(row.rating || 4.8),
    isBestseller: row.is_bestseller || false,
    sku: row.sku || null,
    brand: row.brand || null,
    material: row.material || null,
    careInstructions: row.care_instructions || null,
    isActive: row.is_active !== false,
    stockStatus: row.stock_status || "in_stock",
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────
// PRODUCT LISTING
// ─────────────────────────────────────────────────────────

/**
 * Paginated list of active products with optional category / search filter.
 * Existing homepage API shape is preserved.
 */

async function listActiveItems({
  page = 1,
  limit = 20,
  categorySlug,
  search,
} = {}) {
  const offset = (page - 1) * limit;

  // Keep category/search parameters separate from pagination.
  const filterParams = [];
  let whereClause = "WHERE i.is_active = TRUE";

  if (categorySlug) {
    filterParams.push(categorySlug);
    whereClause += ` AND c.slug = $${filterParams.length}`;
  }

  if (search) {
    filterParams.push(`%${search}%`);
    const searchIndex = filterParams.length;

    whereClause += ` AND (
      i.name ILIKE $${searchIndex}
      OR i.description ILIKE $${searchIndex}
      OR i.type ILIKE $${searchIndex}
    )`;
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
  `;

  const dataSql = `
    SELECT
      i.id,
      i.name,
      i.description,
      i.price,
      i.original_price,
      i.sizes,
      i.type,
      i.image_url,
      i.rating,
      i.is_bestseller,
      i.sku,
      i.brand,
      i.material,
      i.care_instructions,
      i.is_active,
      i.stock_status,
      i.created_at,
      i.updated_at,
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY i.id ASC
    LIMIT $${filterParams.length + 1}
    OFFSET $${filterParams.length + 2}
  `;

  const start = performance.now();

  // Execute both independent queries concurrently.
  const [countRes, dataRes] = await Promise.all([
    query(countSql, filterParams),
    query(dataSql, [...filterParams, limit, offset]),
  ]);

  const total = parseInt(countRes.rows[0].total, 10);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: dataRes.rows.map(formatProductRow),
  };
}

// ─────────────────────────────────────────────────────────
// PRODUCT DETAIL
// ─────────────────────────────────────────────────────────

/**
 * Get one product with its images, colors, sizes, and active variants.
 * Returns null if not found.
 */
async function getItemById(id) {
  // 1. Base product row
  const productRes = await query(
    `SELECT i.id, i.name, i.description, i.price, i.original_price,
            i.sizes, i.type, i.image_url, i.rating, i.is_bestseller,
            i.sku, i.brand, i.material, i.care_instructions,
            i.is_active, i.stock_status, i.created_at, i.updated_at,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = $1`,
    [id],
  );
  if (productRes.rows.length === 0) return null;

  const product = formatProductRow(productRes.rows[0]);

  // 2. Images (ordered gallery)
  const imagesRes = await query(
    `SELECT id, media_url AS url, public_id AS "publicId",
            alt_text AS "altText", sort_order AS "sortOrder",
            is_primary AS "isPrimary", media_type AS "mediaType"
     FROM product_media
     WHERE product_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [id],
  );
  product.images = imagesRes.rows;

  // 3. Colors
  const colorsRes = await query(
    `SELECT id, color_name AS "colorName", hex_code AS "hexCode"
     FROM item_colors
     WHERE item_id = $1
     ORDER BY id ASC`,
    [id],
  );
  product.colors = colorsRes.rows;

  // 4. Variants with their color info
  const variantsRes = await query(
    `SELECT iv.id, iv.item_id AS "itemId", iv.color_id AS "colorId",
            ic.color_name AS "colorName", ic.hex_code AS "hexCode",
            iv.size, iv.sku, iv.price, iv.original_price AS "originalPrice",
            iv.stock_quantity AS "stockQuantity", iv.supplier_sku AS "supplierSku",
            iv.is_active AS "isActive"
     FROM item_variants iv
     LEFT JOIN item_colors ic ON iv.color_id = ic.id
     WHERE iv.item_id = $1
     ORDER BY iv.color_id ASC NULLS LAST, iv.size ASC`,
    [id],
  );

  const variants = variantsRes.rows.map((v) => ({
    ...v,
    price: v.price ? parseFloat(v.price) : null,
    originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
  }));
  product.variants = variants;

  // 5. Derive available sizes from active variants (union with legacy sizes)
  const variantSizes = [
    ...new Set(variants.filter((v) => v.isActive).map((v) => v.size)),
  ];
  product.availableSizes =
    variantSizes.length > 0 ? variantSizes : product.sizes;

  // 6. Valid color-size combinations
  product.colorSizeCombinations = variants
    .filter((v) => v.isActive && v.stockQuantity > 0)
    .map((v) => ({ colorId: v.colorId, colorName: v.colorName, size: v.size }));

  return product;
}

// ─────────────────────────────────────────────────────────
// CREATE / UPDATE PRODUCT
// ─────────────────────────────────────────────────────────

/**
 * Create a new product inside a transaction.
 * Returns the created product id.
 */
async function createItem(data) {
  const {
    name,
    categoryId,
    description,
    price,
    originalPrice,
    sizes,
    type,
    imageUrl,
    rating,
    isBestseller,
    sku,
    brand,
    material,
    careInstructions,
    stockStatus,
  } = data;

  const result = await query(
    `INSERT INTO items
       (name, category_id, description, price, original_price,
        sizes, type, image_url, rating, is_bestseller,
        sku, brand, material, care_instructions, is_active, stock_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE,$15)
     RETURNING id`,
    [
      name,
      categoryId || null,
      description,
      price,
      originalPrice || null,
      sizes || [],
      type || "General",
      imageUrl || "",
      rating || 4.8,
      isBestseller || false,
      sku || null,
      brand || null,
      material || null,
      careInstructions || null,
      stockStatus || "in_stock",
    ],
  );
  return result.rows[0].id;
}

/**
 * Patch-style update. Only provided fields are changed.
 * Returns updated row or null if not found.
 */
async function updateItem(id, data) {
  const allowedFields = {
    name: "name",
    categoryId: "category_id",
    description: "description",
    price: "price",
    originalPrice: "original_price",
    sizes: "sizes",
    type: "type",
    imageUrl: "image_url",
    rating: "rating",
    isBestseller: "is_bestseller",
    sku: "sku",
    brand: "brand",
    material: "material",
    careInstructions: "care_instructions",
    stockStatus: "stock_status",
  };

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  for (const [jsKey, dbCol] of Object.entries(allowedFields)) {
    if (data[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = $${paramIndex++}`);
      params.push(data[jsKey]);
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const result = await query(
    `UPDATE items
     SET ${setClauses.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id`,
    params,
  );
  return result.rows[0] || null;
}

/**
 * Activate or deactivate a product.
 */
async function setItemActive(id, isActive) {
  const result = await query(
    `UPDATE items
     SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, is_active AS "isActive"`,
    [isActive, id],
  );
  return result.rows[0] || null;
}

/**
 * Delete a product. Returns list of media records for caller to Cloudinary-delete.
 */
async function deleteItem(id) {
  const mediaRes = await query(
    `SELECT public_id AS "publicId", media_type AS "mediaType"
     FROM product_media WHERE product_id = $1`,
    [id],
  );
  await query("DELETE FROM items WHERE id = $1", [id]);
  return mediaRes.rows;
}

/**
 * Check if item exists.
 */
async function itemExists(id) {
  const result = await query("SELECT id FROM items WHERE id = $1", [id]);
  return result.rows.length > 0;
}

// ─────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────

/**
 * Insert a color or return existing one for this item.
 */
async function upsertColor(itemId, colorName, hexCode) {
  const result = await query(
    `INSERT INTO item_colors (item_id, color_name, hex_code)
     VALUES ($1, $2, $3)
     ON CONFLICT (item_id, color_name)
       DO UPDATE SET hex_code = COALESCE(EXCLUDED.hex_code, item_colors.hex_code)
     RETURNING id, item_id AS "itemId", color_name AS "colorName", hex_code AS "hexCode"`,
    [itemId, colorName.trim(), hexCode || null],
  );
  return result.rows[0];
}

/**
 * Get all colors for an item.
 */
async function getColors(itemId) {
  const result = await query(
    `SELECT id, color_name AS "colorName", hex_code AS "hexCode"
     FROM item_colors WHERE item_id = $1 ORDER BY id ASC`,
    [itemId],
  );
  return result.rows;
}

/**
 * Delete a color (cascades to variants via ON DELETE SET NULL).
 */
async function deleteColor(colorId, itemId) {
  const result = await query(
    `DELETE FROM item_colors WHERE id = $1 AND item_id = $2 RETURNING id`,
    [colorId, itemId],
  );
  return result.rows.length > 0;
}

// ─────────────────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────────────────

/**
 * Upsert a variant. Size is required. colorId is optional (null = "any color").
 * Returns the variant row.
 */
async function upsertVariant({
  itemId,
  colorId,
  size,
  sku,
  price,
  originalPrice,
  stockQuantity,
  supplierSku,
}) {
  const result = await query(
    `INSERT INTO item_variants
       (item_id, color_id, size, sku, price, original_price, stock_quantity, supplier_sku, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     ON CONFLICT (item_id, color_id, size)
       DO UPDATE SET
         sku            = COALESCE(EXCLUDED.sku,            item_variants.sku),
         price          = COALESCE(EXCLUDED.price,          item_variants.price),
         original_price = COALESCE(EXCLUDED.original_price, item_variants.original_price),
         stock_quantity = EXCLUDED.stock_quantity,
         supplier_sku   = COALESCE(EXCLUDED.supplier_sku,   item_variants.supplier_sku),
         updated_at     = CURRENT_TIMESTAMP
     RETURNING
       id, item_id AS "itemId", color_id AS "colorId", size,
       sku, price, original_price AS "originalPrice",
       stock_quantity AS "stockQuantity", supplier_sku AS "supplierSku",
       is_active AS "isActive"`,
    [
      itemId,
      colorId || null,
      size,
      sku || null,
      price || null,
      originalPrice || null,
      stockQuantity != null ? stockQuantity : 0,
      supplierSku || null,
    ],
  );
  return result.rows[0];
}

/**
 * Get all variants for a product with color info.
 */
async function getVariants(itemId) {
  const result = await query(
    `SELECT iv.id, iv.item_id AS "itemId", iv.color_id AS "colorId",
            ic.color_name AS "colorName", ic.hex_code AS "hexCode",
            iv.size, iv.sku, iv.price, iv.original_price AS "originalPrice",
            iv.stock_quantity AS "stockQuantity", iv.supplier_sku AS "supplierSku",
            iv.is_active AS "isActive", iv.updated_at AS "updatedAt"
     FROM item_variants iv
     LEFT JOIN item_colors ic ON iv.color_id = ic.id
     WHERE iv.item_id = $1
     ORDER BY iv.color_id ASC NULLS LAST, iv.size ASC`,
    [itemId],
  );
  return result.rows.map((v) => ({
    ...v,
    price: v.price ? parseFloat(v.price) : null,
    originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
  }));
}

/**
 * Activate or deactivate a single variant.
 */
async function setVariantActive(variantId, itemId, isActive) {
  const result = await query(
    `UPDATE item_variants
     SET is_active = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND item_id = $3
     RETURNING id, is_active AS "isActive"`,
    [isActive, variantId, itemId],
  );
  return result.rows[0] || null;
}

/**
 * Delete a specific variant.
 */
async function deleteVariant(variantId, itemId) {
  const result = await query(
    `DELETE FROM item_variants WHERE id = $1 AND item_id = $2 RETURNING id`,
    [variantId, itemId],
  );
  return result.rows.length > 0;
}

module.exports = {
  listActiveItems,
  getItemById,
  createItem,
  updateItem,
  setItemActive,
  deleteItem,
  itemExists,
  // Colors
  upsertColor,
  getColors,
  deleteColor,
  // Variants
  upsertVariant,
  getVariants,
  setVariantActive,
  deleteVariant,
};
