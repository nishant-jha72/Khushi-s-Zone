"use strict";

const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

// Apply auth + admin check to all admin promo routes
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/admin/promo
 * @desc    Get all promo codes with redemption statistics
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        COALESCE(SUM(u.discount_amount), 0)::numeric(10,2) AS total_discount_given,
        COUNT(u.id)::int AS actual_redemptions_count
      FROM promo_codes p
      LEFT JOIN promo_code_usage u ON p.id = u.promo_code_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const promos = result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      discountType: row.discount_type,
      discountValue: parseFloat(row.discount_value),
      maxDiscount: row.max_discount !== null ? parseFloat(row.max_discount) : null,
      minOrderAmount: parseFloat(row.min_order_amount || 0),
      usageLimit: row.usage_limit,
      usageCount: row.usage_count,
      actualRedemptionsCount: row.actual_redemptions_count,
      totalDiscountGiven: parseFloat(row.total_discount_given || 0),
      perUserLimit: row.per_user_limit,
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json({
      success: true,
      promos,
      total: promos.length,
    });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch promo codes",
    });
  }
});

/**
 * @route   GET /api/admin/promo/:id
 * @desc    Get single promo code details and recent redemptions
 * @access  Admin
 */
router.get("/:id", async (req, res) => {
  try {
    const promoId = parseInt(req.params.id, 10);
    if (isNaN(promoId)) {
      return res.status(400).json({ success: false, message: "Invalid promo ID" });
    }

    const promoRes = await query(
      `SELECT * FROM promo_codes WHERE id = $1`,
      [promoId]
    );

    if (promoRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    const p = promoRes.rows[0];

    // Fetch recent redemptions
    const usageRes = await query(
      `SELECT u.id, u.user_id, u.order_id, u.discount_amount, u.used_at,
              usr.name as customer_name, usr.email as customer_email,
              o.order_number, o.total_amount as order_total
       FROM promo_code_usage u
       LEFT JOIN users usr ON u.user_id = usr.id
       LEFT JOIN orders o ON u.order_id = o.id
       WHERE u.promo_code_id = $1
       ORDER BY u.used_at DESC
       LIMIT 50`,
      [promoId]
    );

    return res.json({
      success: true,
      promo: {
        id: p.id,
        code: p.code,
        discountType: p.discount_type,
        discountValue: parseFloat(p.discount_value),
        maxDiscount: p.max_discount !== null ? parseFloat(p.max_discount) : null,
        minOrderAmount: parseFloat(p.min_order_amount || 0),
        usageLimit: p.usage_limit,
        usageCount: p.usage_count,
        perUserLimit: p.per_user_limit,
        startDate: p.start_date,
        expiryDate: p.expiry_date,
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
      usages: usageRes.rows.map((u) => ({
        id: u.id,
        orderId: u.order_id,
        orderNumber: u.order_number,
        customerName: u.customer_name,
        customerEmail: u.customer_email,
        discountAmount: parseFloat(u.discount_amount),
        orderTotal: parseFloat(u.order_total || 0),
        usedAt: u.used_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching promo detail:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch promo code" });
  }
});

/**
 * @route   POST /api/admin/promo
 * @desc    Create a new promo code
 * @access  Admin
 */
router.post("/", async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      startDate,
      expiryDate,
      isActive,
    } = req.body;

    // 1. Validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ success: false, message: "Promo code is required" });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: "Code must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores",
      });
    }

    const dType = (discountType || "").toUpperCase();
    if (!["FIXED", "PERCENTAGE"].includes(dType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be either FIXED or PERCENTAGE",
      });
    }

    const dVal = parseFloat(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      return res.status(400).json({
        success: false,
        message: "discountValue must be a positive number",
      });
    }

    if (dType === "PERCENTAGE" && dVal > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    let parsedMaxDiscount = null;
    if (maxDiscount !== undefined && maxDiscount !== null && maxDiscount !== "") {
      parsedMaxDiscount = parseFloat(maxDiscount);
      if (isNaN(parsedMaxDiscount) || parsedMaxDiscount <= 0) {
        return res.status(400).json({
          success: false,
          message: "maxDiscount must be a positive number if provided",
        });
      }
    }

    const parsedMinOrder = minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== ""
      ? parseFloat(minOrderAmount)
      : 0;
    if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
      return res.status(400).json({
        success: false,
        message: "minOrderAmount cannot be negative",
      });
    }

    let parsedUsageLimit = null;
    if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
      parsedUsageLimit = parseInt(usageLimit, 10);
      if (isNaN(parsedUsageLimit) || parsedUsageLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: "usageLimit must be a positive integer if provided",
        });
      }
    }

    const parsedPerUserLimit = perUserLimit !== undefined && perUserLimit !== null && perUserLimit !== ""
      ? parseInt(perUserLimit, 10)
      : 1;
    if (isNaN(parsedPerUserLimit) || parsedPerUserLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "perUserLimit must be a positive integer",
      });
    }

    const now = new Date();
    const parsedStartDate = startDate ? new Date(startDate) : now;
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start date format" });
    }

    if (!expiryDate) {
      return res.status(400).json({ success: false, message: "expiryDate is required" });
    }
    const parsedExpiryDate = new Date(expiryDate);
    if (isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid expiry date format" });
    }

    if (parsedExpiryDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "expiryDate must be after startDate",
      });
    }

    const activeBool = isActive !== undefined ? Boolean(isActive) : true;

    // Check duplicate code
    const existing = await query("SELECT id FROM promo_codes WHERE code = $1", [normalizedCode]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Promo code "${normalizedCode}" already exists`,
      });
    }

    // Insert
    const insertRes = await query(
      `INSERT INTO promo_codes (
        code, discount_type, discount_value, max_discount, min_order_amount,
        usage_limit, usage_count, per_user_limit, start_date, expiry_date, is_active, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        normalizedCode,
        dType,
        dVal,
        parsedMaxDiscount,
        parsedMinOrder,
        parsedUsageLimit,
        parsedPerUserLimit,
        parsedStartDate,
        parsedExpiryDate,
        activeBool,
      ]
    );

    const created = insertRes.rows[0];

    return res.status(201).json({
      success: true,
      message: `Promo code "${normalizedCode}" created successfully!`,
      promo: {
        id: created.id,
        code: created.code,
        discountType: created.discount_type,
        discountValue: parseFloat(created.discount_value),
        maxDiscount: created.max_discount !== null ? parseFloat(created.max_discount) : null,
        minOrderAmount: parseFloat(created.min_order_amount),
        usageLimit: created.usage_limit,
        usageCount: created.usage_count,
        perUserLimit: created.per_user_limit,
        startDate: created.start_date,
        expiryDate: created.expiry_date,
        isActive: created.is_active,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return res.status(500).json({ success: false, message: "Failed to create promo code" });
  }
});

/**
 * @route   PUT /api/admin/promo/:id
 * @desc    Update promo code configuration
 * @access  Admin
 */
router.put("/:id", async (req, res) => {
  try {
    const promoId = parseInt(req.params.id, 10);
    if (isNaN(promoId)) {
      return res.status(400).json({ success: false, message: "Invalid promo ID" });
    }

    const existingRes = await query("SELECT * FROM promo_codes WHERE id = $1", [promoId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    const existing = existingRes.rows[0];

    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      startDate,
      expiryDate,
      isActive,
    } = req.body;

    let updatedCode = existing.code;
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
        return res.status(400).json({
          success: false,
          message: "Code must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores",
        });
      }

      // Check if new code conflicts with another coupon
      const dup = await query("SELECT id FROM promo_codes WHERE code = $1 AND id != $2", [normalizedCode, promoId]);
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: `Promo code "${normalizedCode}" already in use` });
      }
      updatedCode = normalizedCode;
    }

    const dType = discountType ? discountType.toUpperCase() : existing.discount_type;
    if (!["FIXED", "PERCENTAGE"].includes(dType)) {
      return res.status(400).json({ success: false, message: "discountType must be FIXED or PERCENTAGE" });
    }

    const dVal = discountValue !== undefined ? parseFloat(discountValue) : parseFloat(existing.discount_value);
    if (isNaN(dVal) || dVal <= 0) {
      return res.status(400).json({ success: false, message: "discountValue must be a positive number" });
    }
    if (dType === "PERCENTAGE" && dVal > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    let parsedMaxDiscount = existing.max_discount;
    if (maxDiscount !== undefined) {
      if (maxDiscount === null || maxDiscount === "") {
        parsedMaxDiscount = null;
      } else {
        parsedMaxDiscount = parseFloat(maxDiscount);
        if (isNaN(parsedMaxDiscount) || parsedMaxDiscount <= 0) {
          return res.status(400).json({ success: false, message: "maxDiscount must be positive" });
        }
      }
    }

    let parsedMinOrder = existing.min_order_amount;
    if (minOrderAmount !== undefined) {
      parsedMinOrder = parseFloat(minOrderAmount || 0);
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        return res.status(400).json({ success: false, message: "minOrderAmount cannot be negative" });
      }
    }

    let parsedUsageLimit = existing.usage_limit;
    if (usageLimit !== undefined) {
      if (usageLimit === null || usageLimit === "") {
        parsedUsageLimit = null;
      } else {
        parsedUsageLimit = parseInt(usageLimit, 10);
        if (isNaN(parsedUsageLimit) || parsedUsageLimit < existing.usage_count) {
          return res.status(400).json({
            success: false,
            message: `usageLimit cannot be less than current usage count (${existing.usage_count})`,
          });
        }
      }
    }

    let parsedPerUserLimit = existing.per_user_limit;
    if (perUserLimit !== undefined) {
      parsedPerUserLimit = parseInt(perUserLimit, 10);
      if (isNaN(parsedPerUserLimit) || parsedPerUserLimit <= 0) {
        return res.status(400).json({ success: false, message: "perUserLimit must be at least 1" });
      }
    }

    const parsedStartDate = startDate ? new Date(startDate) : new Date(existing.start_date);
    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : new Date(existing.expiry_date);

    if (parsedExpiryDate <= parsedStartDate) {
      return res.status(400).json({ success: false, message: "expiryDate must be after startDate" });
    }

    const activeBool = isActive !== undefined ? Boolean(isActive) : existing.is_active;

    const updateRes = await query(
      `UPDATE promo_codes
       SET code = $1,
           discount_type = $2,
           discount_value = $3,
           max_discount = $4,
           min_order_amount = $5,
           usage_limit = $6,
           per_user_limit = $7,
           start_date = $8,
           expiry_date = $9,
           is_active = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        updatedCode,
        dType,
        dVal,
        parsedMaxDiscount,
        parsedMinOrder,
        parsedUsageLimit,
        parsedPerUserLimit,
        parsedStartDate,
        parsedExpiryDate,
        activeBool,
        promoId,
      ]
    );

    const updated = updateRes.rows[0];

    return res.json({
      success: true,
      message: "Promo code updated successfully!",
      promo: {
        id: updated.id,
        code: updated.code,
        discountType: updated.discount_type,
        discountValue: parseFloat(updated.discount_value),
        maxDiscount: updated.max_discount !== null ? parseFloat(updated.max_discount) : null,
        minOrderAmount: parseFloat(updated.min_order_amount),
        usageLimit: updated.usage_limit,
        usageCount: updated.usage_count,
        perUserLimit: updated.per_user_limit,
        startDate: updated.start_date,
        expiryDate: updated.expiry_date,
        isActive: updated.is_active,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return res.status(500).json({ success: false, message: "Failed to update promo code" });
  }
});

/**
 * @route   PATCH /api/admin/promo/:id/status
 * @desc    Toggle promo code active state
 * @access  Admin
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const promoId = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    if (isNaN(promoId)) {
      return res.status(400).json({ success: false, message: "Invalid promo ID" });
    }

    if (isActive === undefined || typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive boolean is required in request body",
      });
    }

    const updateRes = await query(
      `UPDATE promo_codes
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, code, is_active`,
      [isActive, promoId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    return res.json({
      success: true,
      message: `Promo code ${updateRes.rows[0].code} has been ${isActive ? "activated" : "deactivated"}.`,
      promo: updateRes.rows[0],
    });
  } catch (error) {
    console.error("Error toggling promo status:", error);
    return res.status(500).json({ success: false, message: "Failed to update promo status" });
  }
});

/**
 * @route   DELETE /api/admin/promo/:id
 * @desc    Delete promo code ONLY if it has never been used
 * @access  Admin
 */
router.delete("/:id", async (req, res) => {
  try {
    const promoId = parseInt(req.params.id, 10);
    if (isNaN(promoId)) {
      return res.status(400).json({ success: false, message: "Invalid promo ID" });
    }

    const promoRes = await query("SELECT id, code, usage_count FROM promo_codes WHERE id = $1", [promoId]);
    if (promoRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    const promo = promoRes.rows[0];

    // Check usage in promo_code_usage table or usage_count > 0
    const usageCheck = await query("SELECT COUNT(*)::int as count FROM promo_code_usage WHERE promo_code_id = $1", [promoId]);
    const usageCount = usageCheck.rows[0]?.count || promo.usage_count || 0;

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Promo code "${promo.code}" has already been redeemed ${usageCount} time(s) and cannot be deleted to maintain historical order integrity. Please deactivate it instead.`,
      });
    }

    await query("DELETE FROM promo_codes WHERE id = $1", [promoId]);

    return res.json({
      success: true,
      message: `Promo code "${promo.code}" was permanently deleted.`,
    });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return res.status(500).json({ success: false, message: "Failed to delete promo code" });
  }
});

module.exports = router;
