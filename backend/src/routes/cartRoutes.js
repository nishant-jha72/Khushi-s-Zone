const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Fetch real value & items of cart from database for authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const cartRes = await query(
      `SELECT ci.id as cart_item_id, ci.quantity, ci.size, ci.created_at,
              i.id as item_id, i.name, i.price, i.original_price, i.image_url, i.type, c.slug as category
       FROM cart_items ci
       JOIN items i ON ci.item_id = i.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC;`,
      [req.user.userId]
    );

    const items = cartRes.rows.map((row) => ({
      cartItemId: row.cart_item_id,
      quantity: row.quantity,
      size: row.size,
      product: {
        id: row.item_id.toString(),
        itemId: row.item_id,
        name: row.name,
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        image: row.image_url,
        type: row.type,
        category: row.category || "dresses"
      }
    }));

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    res.json({
      success: true,
      items,
      totalCount,
      totalPrice
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
});

/**
 * @route   POST /api/cart
 * @desc    Add item to cart in database
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { itemId, quantity = 1, size = "M" } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }

    const parsedItemId = parseInt(itemId, 10);

    const result = await query(
      `INSERT INTO cart_items (user_id, item_id, quantity, size)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, item_id, size)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *;`,
      [req.user.userId, parsedItemId, quantity, size]
    );

    res.json({
      success: true,
      message: "Item added to cart",
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
});

/**
 * @route   PUT /api/cart/:cartItemId
 * @desc    Update quantity or size of cart item
 */
router.put("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await query("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [cartItemId, req.user.userId]);
      return res.json({ success: true, message: "Item removed from cart" });
    }

    await query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3",
      [quantity, cartItemId, req.user.userId]
    );

    res.json({ success: true, message: "Cart item updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update cart item" });
  }
});

/**
 * @route   DELETE /api/cart/:cartItemId
 * @desc    Remove item from cart in database
 */
router.delete("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const { cartItemId } = req.params;
    await query("DELETE FROM cart_items WHERE (id = $1 OR item_id = $1) AND user_id = $2", [cartItemId, req.user.userId]);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove item from cart" });
  }
});

module.exports = router;
