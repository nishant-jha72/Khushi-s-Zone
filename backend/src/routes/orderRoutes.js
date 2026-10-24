const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { createOrder } = require("../services/orderService");
const { sendOrderNotificationEmail } = require("../services/emailService");

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Fetch past orders for authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const ordersRes = await query(
      `SELECT id, order_number, total_amount, order_status as status, payment_method, payment_status, shipping_address, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [req.user.userId],
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.id, oi.quantity, oi.price, oi.unit_price, oi.size, oi.product_name,
                i.id as item_id, i.name, i.image_url, i.type
         FROM order_items oi
         LEFT JOIN items i ON oi.item_id = i.id
         WHERE oi.order_id = $1;`,
        [order.id],
      );

      orders.push({
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        status: order.status || order.order_status,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        shippingAddress: order.shipping_address,
        createdAt: order.created_at,
        items: itemsRes.rows.map((item) => ({
          id: item.id,
          itemId: item.item_id,
          name: item.product_name || item.name,
          image: item.image_url,
          price: parseFloat(item.unit_price || item.price || 0),
          quantity: item.quantity,
          size: item.size,
          type: item.type,
        })),
      });
    }

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Retrieve the authenticated user's orders (alias)
 */
router.get("/my-orders", authenticateToken, async (req, res) => {
  try {
    const ordersRes = await query(
      `SELECT id, order_number, total_amount, order_status as status, payment_method, payment_status, shipping_address, created_at, address_id
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [req.user.userId],
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.id, oi.quantity, oi.unit_price, oi.price, oi.size, oi.product_name, oi.manufacturer_id,
                i.id as item_id, i.image_url
         FROM order_items oi
         LEFT JOIN items i ON oi.item_id = i.id
         WHERE oi.order_id = $1;`,
        [order.id],
      );

      const fulfillmentsRes = await query(
        `SELECT of.*, md.shop_name 
         FROM order_fulfillments of
         LEFT JOIN manufacturer_details md ON of.manufacturer_id = md.id
         WHERE of.order_id = $1;`,
        [order.id],
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
          name: item.product_name,
          image: item.image_url,
          price: parseFloat(item.unit_price || item.price || 0),
          quantity: item.quantity,
          size: item.size,
          manufacturerId: item.manufacturer_id,
        })),
        fulfillments: fulfillmentsRes.rows,
      });
    }

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

/**
 * @route   GET /api/orders/:orderId
 * @desc    Retrieve an order's details
 */
router.get("/:orderId", authenticateToken, async (req, res) => {
  try {
    const orderRes = await query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [req.params.orderId],
    );

    if (orderRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];

    // Check authorization
    if (order.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const itemsRes = await query(
      `SELECT oi.*, i.image_url, md.shop_name, md.owner_name, md.personal_number
       FROM order_items oi
       LEFT JOIN items i ON oi.item_id = i.id
       LEFT JOIN manufacturer_details md ON oi.manufacturer_id = md.id
       WHERE oi.order_id = $1`,
      [order.id],
    );

    const fulfillmentsRes = await query(
      `SELECT of.*, md.shop_name, md.owner_name, md.personal_number
       FROM order_fulfillments of
       LEFT JOIN manufacturer_details md ON of.manufacturer_id = md.id
       WHERE of.order_id = $1`,
      [order.id],
    );

    const historyRes = await query(
      `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [order.id],
    );

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsRes.rows,
        fulfillments: fulfillmentsRes.rows,
        statusHistory: historyRes.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

/**
 * @route   GET /api/orders/:orderId/tracking
 * @desc    Retrieve tracking information and status history
 */
router.get("/:orderId/tracking", authenticateToken, async (req, res) => {
  try {
    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [
      req.params.orderId,
    ]);

    if (orderRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];
    if (order.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const fulfillmentsRes = await query(
      `SELECT of.*, md.shop_name 
       FROM order_fulfillments of
       LEFT JOIN manufacturer_details md ON of.manufacturer_id = md.id
       WHERE of.order_id = $1`,
      [order.id],
    );

    const historyRes = await query(
      `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [order.id],
    );

    res.json({
      success: true,
      tracking: {
        orderNumber: order.order_number,
        overallStatus: order.order_status,
        paymentStatus: order.payment_status,
        fulfillments: fulfillmentsRes.rows,
        history: historyRes.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch tracking" });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Place a new order from active cart items
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, addressId, customerNotes } =
      req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart items are required" });
    }

    if (!addressId && !shippingAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Delivery address is required" });
    }

    const shippingAddressParsed =
      typeof shippingAddress === "string"
        ? JSON.parse(shippingAddress)
        : shippingAddress;
    const result = await createOrder({
      userId: req.user.userId,
      addressId: shippingAddressParsed?.addressId,
      items,
      paymentMethod: paymentMethod || "COD",
      customerNotes,
    });
    try {
      const orderFullRes = await query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [result.orderId],
      );
      const orderFull = orderFullRes.rows[0];

      const itemsRes = await query(
        `SELECT oi.*, md.shop_name
         FROM order_items oi
         LEFT JOIN manufacturer_details md ON oi.manufacturer_id = md.id
         WHERE oi.order_id = $1`,
        [result.orderId],
      );

      let addressData = null;
      try {
        if (typeof orderFull.shipping_address === "string") {
          addressData = JSON.parse(orderFull.shipping_address);
        } else {
          addressData = orderFull.shipping_address;
        }
      } catch (e) {
        addressData = orderFull.shipping_address;
      }

      sendOrderNotificationEmail({
        orderNumber: result.orderNumber,
        createdAt: orderFull.created_at,
        orderStatus: result.status,
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        subtotal: orderFull.subtotal || result.totalAmount,
        deliveryFee: orderFull.delivery_fee || 0,
        discountAmount: orderFull.discount_amount || 0,
        totalAmount: result.totalAmount,
        customer: {
          name: orderFull.customer_name,
          email: orderFull.customer_email,
          phone: orderFull.customer_phone,
        },
        address: addressData,
        items: itemsRes.rows,
      }).catch((err) => console.error("Email notification error:", err));
    } catch (emailErr) {
      console.error("Error preparing email:", emailErr);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orderNumber: result.orderNumber,
      orderId: result.orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
});

/**
 * @route   PATCH /api/admin/orders/:orderId/status
 * @desc    Update order status for authorized administrators
 */
router.patch(
  "/admin/orders/:orderId/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, notes, fulfillmentId, trackingNumber, courierName } =
        req.body;

      const orderRes = await query("SELECT * FROM orders WHERE id = $1", [
        req.params.orderId,
      ]);
      if (orderRes.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ];
      if (status && !validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      if (status) {
        await query(
          "UPDATE orders SET order_status = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [
            status,
            status.charAt(0).toUpperCase() + status.slice(1),
            req.params.orderId,
          ],
        );

        await query(
          `INSERT INTO order_status_history (order_id, status, notes, actor_type, actor_id)
         VALUES ($1, $2, $3, $4, $5)`,
          [
            req.params.orderId,
            status,
            notes || `Status updated to ${status}`,
            "admin",
            req.user.userId,
          ],
        );
      }

      if (fulfillmentId) {
        const updates = [];
        const params = [];
        let idx = 1;

        if (status === "shipped") {
          updates.push(
            `fulfillment_status = $${idx++}`,
            `shipped_at = CURRENT_TIMESTAMP`,
          );
        } else if (status === "delivered") {
          updates.push(
            `fulfillment_status = $${idx++}`,
            `delivered_at = CURRENT_TIMESTAMP`,
          );
        } else if (status) {
          updates.push(`fulfillment_status = $${idx++}`);
          params.push(status);
        }

        if (trackingNumber) {
          updates.push(`tracking_number = $${idx++}`);
          params.push(trackingNumber);
        }
        if (courierName) {
          updates.push(`courier_name = $${idx++}`);
          params.push(courierName);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        params.push(fulfillmentId);
        await query(
          `UPDATE order_fulfillments SET ${updates.join(", ")} WHERE id = $${idx}`,
          params,
        );
      }

      res.json({ success: true, message: "Order updated successfully" });
    } catch (error) {
      console.error("Error updating order:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update order" });
    }
  },
);

module.exports = router;
