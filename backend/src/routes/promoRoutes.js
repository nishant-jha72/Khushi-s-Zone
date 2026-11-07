"use strict";

const express = require("express");
const { optionalAuthenticateToken } = require("../middleware/authMiddleware");
const {
  validatePromoCode,
  getAvailablePromos,
} = require("../services/promoService");

const router = express.Router();

/**
 * @route   POST /api/promo/validate
 * @desc    Validate a promo code and calculate trusted discount
 * @access  Public / Optional Auth
 */
router.post("/validate", optionalAuthenticateToken, async (req, res) => {
  try {
    const { code, cartItems } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid promo code",
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const result = await validatePromoCode({
      code,
      cartItems,
      userId,
    });

    return res.json({
      success: true,
      message: "Promo code applied successfully!",
      promo: result.promo,
      calculation: result.calculation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to validate promo code",
    });
  }
});

/**
 * @route   GET /api/promo/available
 * @desc    Retrieve list of active coupons currently available for redemption
 * @access  Public / Optional Auth
 */
router.get("/available", optionalAuthenticateToken, async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const promos = await getAvailablePromos(userId);

    return res.json({
      success: true,
      promos,
    });
  } catch (error) {
    console.error("Error fetching available promos:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve available promo codes",
    });
  }
});

module.exports = router;
