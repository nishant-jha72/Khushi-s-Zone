const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Fetch past orders for authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const ordersRes = await query(
      `SELECT id, order_number, total_amount, status, payment_method, payment_status, shipping_address, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [req.user.userId]
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.id, oi.quantity, oi.price, oi.size, i.id as item_id, i.name, i.image_url, i.type
         FROM order_items oi
         JOIN items i ON oi.item_id = i.id
         WHERE oi.order_id = $1;`,
        [order.id]
      );

      orders.push({
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        shippingAddress: order.shipping_address,
        createdAt: order.created_at,
        items: itemsRes.rows.map((item) => ({
          id: item.id,
          itemId: item.item_id,
          name: item.name,
          image: item.image_url,
          price: parseFloat(item.price),
          quantity: item.quantity,
          size: item.size,
          type: item.type
        }))
      });
    }

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Place a new order from active cart items
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    const orderNumber = `KZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderRes = await query(
      `INSERT INTO orders (order_number, user_id, total_amount, status, payment_method, payment_status, shipping_address)
       VALUES ($1, $2, $3, 'Processing', $4, 'Paid', $5)
       RETURNING id, order_number, created_at;`,
      [orderNumber, req.user.userId, totalAmount, paymentMethod || "UPI / Card", shippingAddress || "Default Address"]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, item_id, quantity, price, size)
         VALUES ($1, $2, $3, $4, $5);`,
        [orderId, item.itemId || item.id, item.quantity, item.price, item.size || "M"]
      );
    }

    // Clear cart in DB
    await query("DELETE FROM cart_items WHERE user_id = $1", [req.user.userId]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orderNumber,
      orderId
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

module.exports = router;
