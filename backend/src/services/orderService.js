const { pool } = require("../config/db");

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `KZ-${year}-${random}`;
}

async function createOrder({
  userId,
  addressId,
  items,
  paymentMethod,
  customerNotes,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate address belongs to user
    const addressRes = await client.query(
      "SELECT * FROM user_address WHERE id = $1 AND user_id = $2",
      [addressId, userId],
    );
    console.log("AddresID , UserID:", addressId, userId);

    console.log("Address validation result:", addressRes.rows);

    if (addressRes.rows.length === 0) {
      throw new Error("Invalid address");
    }

    // Load items with manufacturers
    const itemIds = items.map((i) => i.itemId || i.id);
    const itemsRes = await client.query(
      `SELECT i.*, m.id as manufacturer_id, m.cod_allowed, m.is_active as manufacturer_active
       FROM items i
       LEFT JOIN manufacturer_details m ON i.manufacturer_id = m.id
       WHERE i.id = ANY($1) AND i.is_active = TRUE`,
      [itemIds],
    );

    if (itemsRes.rows.length !== itemIds.length) {
      throw new Error("Some products are unavailable");
    }

    // Build a map
    const itemMap = {};
    for (const row of itemsRes.rows) {
      itemMap[row.id] = row;
    }

    // Check all manufacturers active and COD eligibility
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = itemMap[item.itemId || item.id];
      if (!dbItem) throw new Error("Product not found");
      if (!dbItem.manufacturer_id || !dbItem.manufacturer_active) {
        throw new Error("Product unavailable");
      }
      const quantity = parseInt(item.quantity) || 1;
      if (quantity <= 0) throw new Error("Invalid quantity");
      const unitPrice = parseFloat(dbItem.price);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      orderItemsData.push({
        itemId: dbItem.id,
        manufacturerId: dbItem.manufacturer_id,
        productName: dbItem.name,
        unitPrice,
        quantity,
        lineTotal,
        codAllowed: dbItem.cod_allowed,
      });
    }

    // Check COD eligibility for all manufacturers
    if (paymentMethod === "COD") {
      for (const oi of orderItemsData) {
        if (!oi.codAllowed) {
          throw new Error("COD not available for some items");
        }
      }
    }

    const deliveryFee = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + deliveryFee - discountAmount;

    const orderNumber = generateOrderNumber();

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, user_id, address_id, total_amount, subtotal, delivery_fee, discount_amount,
        status, order_status, payment_method, payment_status, shipping_address, customer_notes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        orderNumber,
        userId,
        addressId,
        totalAmount,
        subtotal,
        deliveryFee,
        discountAmount,
        paymentMethod === "COD" ? "Processing" : "Pending",
        paymentMethod === "COD" ? "confirmed" : "pending",
        paymentMethod,
        paymentMethod === "COD" ? "pending" : "pending",
        JSON.stringify(addressRes.rows[0]),
        customerNotes || null,
      ],
    );

    const orderId = orderRes.rows[0].id;

    // Create order items with snapshots
    for (const oi of orderItemsData) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, manufacturer_id, product_name, unit_price, quantity, price, line_total, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          oi.itemId,
          oi.manufacturerId,
          oi.productName,
          oi.unitPrice,
          oi.quantity,
          oi.unitPrice,
          oi.lineTotal,
          items.find((i) => (i.itemId || i.id) == oi.itemId)?.size || "M",
        ],
      );
    }

    // Create fulfillments grouped by manufacturer
    const manufacturers = [
      ...new Set(orderItemsData.map((oi) => oi.manufacturerId)),
    ];
    for (const mId of manufacturers) {
      await client.query(
        `INSERT INTO order_fulfillments (order_id, manufacturer_id, fulfillment_status)
         VALUES ($1, $2, $3)`,
        [orderId, mId, "pending"],
      );
    }

    // Add status history
    await client.query(
      `INSERT INTO order_status_history (order_id, status, notes, actor_type)
       VALUES ($1, $2, $3, $4)`,
      [orderId, orderRes.rows[0].order_status, "Order created", "system"],
    );

    // Clear cart
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    await client.query("COMMIT");

    return {
      orderId,
      orderNumber,
      totalAmount,
      status: orderRes.rows[0].order_status,
      paymentMethod,
      paymentStatus: orderRes.rows[0].payment_status,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createOrder, generateOrderNumber };
