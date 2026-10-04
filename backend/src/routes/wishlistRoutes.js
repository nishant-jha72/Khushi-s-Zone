const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/wishlist
 * @desc    Fetch user's wishlist from database
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const wishlistRes = await query(
      `SELECT wi.id as wishlist_id, wi.created_at,
              i.id as item_id, i.name, i.price, i.original_price, i.image_url, i.type, c.slug as category
       FROM wishlist_items wi
       JOIN items i ON wi.item_id = i.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE wi.user_id = $1
       ORDER BY wi.created_at DESC;`,
      [req.user.userId]
    );

    const products = wishlistRes.rows.map((row) => ({
      id: row.item_id.toString(),
      itemId: row.item_id,
      wishlistId: row.wishlist_id,
      name: row.name,
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      image: row.image_url,
      type: row.type,
      category: row.category || "dresses"
    }));

    res.json({
      success: true,
      wishlistCount: products.length,
      wishlist: products.map((p) => p.id),
      products
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
});

/**
 * @route   POST /api/wishlist/toggle
 * @desc    Toggle item in database wishlist
 */
router.post("/toggle", authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }

    const parsedItemId = parseInt(itemId, 10);

    const checkRes = await query(
      "SELECT id FROM wishlist_items WHERE user_id = $1 AND item_id = $2",
      [req.user.userId, parsedItemId]
    );

    if (checkRes.rows.length > 0) {
      // Remove
      await query("DELETE FROM wishlist_items WHERE user_id = $1 AND item_id = $2", [req.user.userId, parsedItemId]);
      res.json({ success: true, isWishlisted: false, message: "Removed from wishlist" });
    } else {
      // Add
      await query("INSERT INTO wishlist_items (user_id, item_id) VALUES ($1, $2)", [req.user.userId, parsedItemId]);
      res.json({ success: true, isWishlisted: true, message: "Added to wishlist" });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ success: false, message: "Failed to update wishlist" });
  }
});

module.exports = router;
