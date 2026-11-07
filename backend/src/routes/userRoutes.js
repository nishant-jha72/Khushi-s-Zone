const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile details
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      "SELECT id, name, email, phone, address, city, state, pincode, avatar, is_verified, created_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (userRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const u = userRes.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        address: u.address || "",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || "",
        avatar: u.avatar || "",
        isVerified: u.is_verified,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile details (Name, Phone, Address, City, State, Pincode)
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;

    const updateRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           pincode = COALESCE($6, pincode),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, email, phone, address, city, state, pincode, avatar, is_verified;`,
      [name, phone, address, city, state, pincode, req.user.userId],
    );

    const u = updateRes.rows[0];

    res.json({
      success: true,
      message: "Account details updated successfully!",
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        address: u.address || "",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || "",
        avatar: u.avatar || "",
        isVerified: u.is_verified,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});
function parseShippingAddress(raw) {
  if (!raw) {
    return {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      postalCode: "",
      phoneNumber: "",
      country: "India",
      formatted: "",
    };
  }

  if (typeof raw === "object") {
    const fullName = raw.fullName || raw.full_name || raw.name || "";
    const addressLine1 = raw.addressLine1 || raw.address_line1 || "";
    const addressLine2 = raw.addressLine2 || raw.address_line2 || "";
    const city = raw.city || "";
    const district = raw.district || "";
    const state = raw.state || "";
    const postalCode = raw.postalCode || raw.postal_code || raw.pincode || "";
    const phoneNumber = raw.phoneNumber || raw.phone_number || raw.phone || "";
    const country = raw.country || "India";
    const parts = [
      fullName,
      addressLine1,
      addressLine2,
      city,
      district,
      state ? `${state} ${postalCode}`.trim() : postalCode,
      country,
    ].filter(Boolean);

    return {
      fullName,
      addressLine1,
      addressLine2,
      city,
      district,
      state,
      postalCode,
      phoneNumber,
      country,
      formatted: raw.formatted_address || raw.formattedAddress || parts.join(", "),
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return parseShippingAddress(parsed);
  } catch (e) {
    return {
      fullName: "",
      addressLine1: String(raw),
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      postalCode: "",
      phoneNumber: "",
      country: "India",
      formatted: String(raw),
    };
  }
}

function normalizeStatus(order) {
  const raw = (order.order_status || order.status || "Pending").trim();
  const lower = raw.toLowerCase();

  let displayStatus = "Pending";
  let isCurrent = true;

  if (["delivered"].includes(lower)) {
    displayStatus = "Delivered";
    isCurrent = false;
  } else if (["cancelled", "canceled"].includes(lower)) {
    displayStatus = "Cancelled";
    isCurrent = false;
  } else if (["returned"].includes(lower)) {
    displayStatus = "Returned";
    isCurrent = false;
  } else if (["failed"].includes(lower)) {
    displayStatus = "Failed";
    isCurrent = false;
  } else if (["shipped"].includes(lower)) {
    displayStatus = "Shipped";
    isCurrent = true;
  } else if (["out_for_delivery", "out for delivery"].includes(lower)) {
    displayStatus = "Out for Delivery";
    isCurrent = true;
  } else if (["processing"].includes(lower)) {
    displayStatus = "Processing";
    isCurrent = true;
  } else if (["confirmed"].includes(lower)) {
    displayStatus = "Confirmed";
    isCurrent = true;
  } else if (["pending"].includes(lower)) {
    displayStatus = "Pending";
    isCurrent = true;
  } else {
    displayStatus = raw.charAt(0).toUpperCase() + raw.slice(1);
    isCurrent = !["delivered", "cancelled", "returned", "failed"].includes(lower);
  }

  return { displayStatus, isCurrent, rawStatus: lower };
}

/**
 * @route   GET /api/user/orders
 * @desc    Get logged-in user's current and past orders
 */
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const ordersRes = await query(
      `SELECT id, order_number, total_amount, subtotal, delivery_fee, discount_amount, promo_code,
              status, order_status, payment_method, payment_status, shipping_address,
              customer_notes, created_at, updated_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    const formattedOrders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.id, oi.item_id, oi.quantity, oi.price, oi.unit_price, oi.size, oi.product_name,
                i.name as item_name, i.image_url, i.type
         FROM order_items oi
         LEFT JOIN items i ON oi.item_id = i.id
         WHERE oi.order_id = $1
         ORDER BY oi.id ASC`,
        [order.id],
      );

      const { displayStatus, isCurrent, rawStatus } = normalizeStatus(order);
      const shippingAddressObj = parseShippingAddress(order.shipping_address);

      const items = itemsRes.rows.map((item) => ({
        id: item.id,
        itemId: item.item_id,
        name: item.product_name || item.item_name || "Fashion Item",
        image: item.image_url || "",
        price: parseFloat(item.unit_price || item.price || 0),
        quantity: item.quantity || 1,
        size: item.size || "M",
        type: item.type || "",
      }));

      formattedOrders.push({
        id: order.id,
        orderNumber: order.order_number || `KZ-${order.id}`,
        order_number: order.order_number || `KZ-${order.id}`,
        totalAmount: parseFloat(order.total_amount || 0),
        total_amount: parseFloat(order.total_amount || 0),
        subtotal: order.subtotal ? parseFloat(order.subtotal) : parseFloat(order.total_amount || 0),
        deliveryFee: parseFloat(order.delivery_fee || 0),
        discountAmount: parseFloat(order.discount_amount || 0),
        promoCode: order.promo_code || null,
        status: displayStatus,
        order_status: rawStatus,
        rawStatus,
        isCurrent,
        paymentMethod: order.payment_method || "COD",
        payment_method: order.payment_method || "COD",
        paymentStatus: order.payment_status || "Pending",
        payment_status: order.payment_status || "Pending",
        shippingAddress: shippingAddressObj,
        shipping_address: order.shipping_address,
        customerNotes: order.customer_notes,
        createdAt: order.created_at,
        created_at: order.created_at,
        updatedAt: order.updated_at,
        updated_at: order.updated_at,
        items,
      });
    }

    const currentOrders = formattedOrders.filter((order) => order.isCurrent);
    const pastOrders = formattedOrders.filter((order) => !order.isCurrent);

    return res.status(200).json({
      success: true,
      currentOrders,
      pastOrders,
      orders: formattedOrders,
      totalOrders: formattedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});

module.exports = router;
