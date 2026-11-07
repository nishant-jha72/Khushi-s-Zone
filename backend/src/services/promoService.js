"use strict";

const { query } = require("../config/db");

/**
 * Calculates discount amount based on promo configuration and subtotal.
 * Avoids floating-point precision issues by rounding to 2 decimal places.
 *
 * @param {Object} promo - The promo code record from DB
 * @param {number} subtotal - The trusted subtotal
 * @returns {number} The calculated discount amount
 */
function calculateDiscount(promo, subtotal) {
  const discountType = (
    promo.discount_type ||
    promo.discountType ||
    ""
  ).toUpperCase();
  const discountValue = parseFloat(
    promo.discount_value || promo.discountValue || 0,
  );
  const maxDiscount =
    promo.max_discount !== null && promo.max_discount !== undefined
      ? parseFloat(promo.max_discount)
      : null;

  let discount = 0;

  if (discountType === "FIXED") {
    // Discount is fixed amount, capped at subtotal so order does not go negative
    discount = Math.min(subtotal, discountValue);
  } else if (discountType === "PERCENTAGE") {
    // Percentage discount
    const rawDiscount = (subtotal * discountValue) / 100;
    discount = Math.round(rawDiscount * 100) / 100;

    // Apply max discount cap if configured
    if (maxDiscount !== null && !isNaN(maxDiscount) && maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }

    // Ensure discount never exceeds subtotal
    discount = Math.min(subtotal, discount);
  } else {
    throw new Error(`Unsupported discount type: ${discountType}`);
  }

  // Round to 2 decimal places and ensure non-negative
  return Math.max(0, Math.round(discount * 100) / 100);
}

/**
 * Validates a promo code against trusted DB cart items and user context.
 *
 * @param {Object} params
 * @param {string} params.code - The raw promo code string
 * @param {Array} params.cartItems - Array of { productId/itemId/id, quantity }
 * @param {number|null} [params.userId] - Optional authenticated user ID
 * @param {Object} [params.dbClient] - Optional PG client for transactions
 * @returns {Promise<Object>} Validation result with calculation
 */
async function validatePromoCode({
  code,
  cartItems,
  userId = null,
  dbClient = null,
}) {
  const db = dbClient || { query };

  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Promo code is required");
  }

  const normalizedCode = code.trim().toUpperCase();

  // 1. Fetch promo code
  const promoRes = await db.query(`SELECT * FROM promo_codes WHERE code = $1`, [
    normalizedCode,
  ]);
  if (promoRes.rows.length === 0) {
    throw new Error("Invalid promo code");
  }

  const promo = promoRes.rows[0];

  // 2. Check if active
  if (!promo.is_active) {
    throw new Error("This promo code is currently inactive");
  }

  // 3. Check dates
  const now = new Date();
  const startDate = new Date(promo.start_date);
  const expiryDate = new Date(promo.expiry_date);

  if (now < startDate) {
    throw new Error("This promo code is not active yet");
  }

  if (now > expiryDate) {
    throw new Error("This promo code has expired");
  }

  // 4. Check global usage limit
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    throw new Error("This promo code has reached its maximum usage limit");
  }

  // 5. Check per-user usage limit if user is authenticated
  if (userId) {
    const userUsageRes = await db.query(
      `SELECT COUNT(*)::int as count FROM promo_code_usage WHERE promo_code_id = $1 AND user_id = $2`,
      [promo.id, userId],
    );

    const userCount = userUsageRes.rows[0]?.count || 0;
    const perUserLimit = promo.per_user_limit || 1;

    if (userCount >= perUserLimit) {
      throw new Error(
        `You have already redeemed this promo code the maximum allowed (${perUserLimit}) time(s)`,
      );
    }
  }

  // 6. Calculate trusted cart subtotal from database prices
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }
  const itemIds = cartItems
    .map((item) => parseInt(item.itemId || item.productId || item.id, 10))
    .filter((id) => !isNaN(id) && id > 0);

  if (itemIds.length === 0) {
    throw new Error("No valid products in cart");
  }

  const itemsRes = await db.query(
    `SELECT id, name, price, is_active FROM items WHERE id = ANY($1)`,
    [itemIds],
  );

  if (itemsRes.rows.length === 0) {
    throw new Error("Selected products are no longer available");
  }

  const itemPriceMap = new Map();
  for (const row of itemsRes.rows) {
    if (!row.is_active) {
      throw new Error(`Product "${row.name}" is no longer available`);
    }
    itemPriceMap.set(row.id, parseFloat(row.price));
  }

  let subtotal = 0;
  for (const ci of cartItems) {
    const id = parseInt(ci.itemId || ci.productId || ci.id, 10);
    const price = itemPriceMap.get(id);
    if (price === undefined) {
      throw new Error("One or more items in your cart could not be verified");
    }
    const qty = parseInt(ci.quantity, 10) || 1;
    if (qty <= 0) {
      throw new Error("Invalid item quantity");
    }
    subtotal += price * qty;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // 7. Check minimum order amount
  const minOrderAmount = parseFloat(promo.min_order_amount || 0);
  if (subtotal < minOrderAmount) {
    throw new Error(
      `Minimum cart subtotal of ₹${minOrderAmount.toLocaleString("en-IN")} is required to use code ${promo.code}`,
    );
  }

  // 8. Calculate discount
  const discount = calculateDiscount(promo, subtotal);
  const finalAmount = Math.max(
    0,
    Math.round((subtotal - discount) * 100) / 100,
  );

  return {
    valid: true,
    promo: {
      id: promo.id,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: parseFloat(promo.discount_value),
      maxDiscount:
        promo.max_discount !== null ? parseFloat(promo.max_discount) : null,
      minOrderAmount: parseFloat(promo.min_order_amount || 0),
    },
    calculation: {
      subtotal,
      discount,
      finalAmount,
    },
  };
}

/**
 * Validates and locks a promo code inside a transaction (FOR UPDATE).
 * Increments usage_count atomically and prepares for order insertion.
 *
 * @param {Object} client - Active PG transaction client
 * @param {Object} params
 * @param {string} params.code - Promo code string
 * @param {number} params.userId - Authenticated user ID
 * @param {number} params.subtotal - Trusted order subtotal
 * @returns {Promise<Object>} { promo, discountAmount }
 */
async function validateAndLockPromoInTransaction(
  client,
  { code, userId, subtotal },
) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Promo code is required");
  }

  const normalizedCode = code.trim().toUpperCase();

  // Lock the row to prevent concurrent race conditions
  const promoRes = await client.query(
    `SELECT * FROM promo_codes WHERE code = $1 FOR UPDATE`,
    [normalizedCode],
  );

  if (promoRes.rows.length === 0) {
    throw new Error("Invalid promo code");
  }

  const promo = promoRes.rows[0];

  if (!promo.is_active) {
    throw new Error("Promo code is currently inactive");
  }

  const now = new Date();
  if (now < new Date(promo.start_date)) {
    throw new Error("Promo code is not active yet");
  }
  if (now > new Date(promo.expiry_date)) {
    throw new Error("Promo code has expired");
  }

  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    throw new Error("Promo code usage limit has been reached");
  }

  // Check per-user redemptions
  if (userId) {
    const userUsageRes = await client.query(
      `SELECT COUNT(*)::int as count FROM promo_code_usage WHERE promo_code_id = $1 AND user_id = $2`,
      [promo.id, userId],
    );
    const count = userUsageRes.rows[0]?.count || 0;
    if (count >= promo.per_user_limit) {
      throw new Error(
        `You have reached the maximum redemption limit for promo code ${promo.code}`,
      );
    }
  }

  // Check minimum order amount
  const minOrder = parseFloat(promo.min_order_amount || 0);
  if (subtotal < minOrder) {
    throw new Error(
      `Minimum order amount of ₹${minOrder.toLocaleString("en-IN")} required for promo code ${promo.code}`,
    );
  }

  // Calculate discount
  const discountAmount = calculateDiscount(promo, subtotal);

  // Increment usage count atomically
  const updateRes = await client.query(
    `UPDATE promo_codes
     SET usage_count = usage_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND (usage_limit IS NULL OR usage_count < usage_limit)
     RETURNING usage_count`,
    [promo.id],
  );

  if (updateRes.rows.length === 0) {
    throw new Error("Promo code usage limit was reached during checkout");
  }

  return {
    promo,
    discountAmount,
  };
}

/**
 * Fetches available, active promo codes within valid date window.
 * Optionally excludes coupons where the user has reached their per_user_limit.
 *
 * @param {number|null} [userId]
 * @returns {Promise<Array>} List of available promo codes
 */
async function getAvailablePromos(userId = null) {
  let queryText = `
    SELECT id, code, discount_type, discount_value, max_discount, min_order_amount,
           start_date, expiry_date, per_user_limit
    FROM promo_codes
    WHERE is_active = TRUE
      AND CURRENT_TIMESTAMP >= start_date
      AND CURRENT_TIMESTAMP <= expiry_date
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    ORDER BY discount_value DESC, min_order_amount ASC
  `;

  const res = await query(queryText);
  let available = res.rows;

  if (userId) {
    // Query usage per coupon for this user
    const userUsage = await query(
      `SELECT promo_code_id, COUNT(*)::int as count
       FROM promo_code_usage
       WHERE user_id = $1
       GROUP BY promo_code_id`,
      [userId],
    );

    const usageMap = new Map();
    for (const r of userUsage.rows) {
      usageMap.set(r.promo_code_id, r.count);
    }

    available = available.filter((p) => {
      const used = usageMap.get(p.id) || 0;
      return used < p.per_user_limit;
    });
  }

  return available.map((p) => ({
    id: p.id,
    code: p.code,
    discountType: p.discount_type,
    discountValue: parseFloat(p.discount_value),
    maxDiscount: p.max_discount !== null ? parseFloat(p.max_discount) : null,
    minOrderAmount: parseFloat(p.min_order_amount || 0),
    expiryDate: p.expiry_date,
    perUserLimit: p.per_user_limit,
  }));
}

module.exports = {
  calculateDiscount,
  validatePromoCode,
  validateAndLockPromoInTransaction,
  getAvailablePromos,
};
