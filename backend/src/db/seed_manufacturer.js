const { pool } = require("../config/db");

async function seedManufacturer() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if dummy manufacturer exists
    const existing = await client.query(
      "SELECT id FROM manufacturer_details WHERE shop_name = $1",
      ["Khushi's Zone Default Manufacturer"]
    );

    let manufacturerId;
    let paymentId;

    if (existing.rows.length > 0) {
      manufacturerId = existing.rows[0].id;
      const m = await client.query(
        "SELECT payment_details_id FROM manufacturer_details WHERE id = $1",
        [manufacturerId]
      );
      paymentId = m.rows[0].payment_details_id;
      console.log("Dummy manufacturer already exists");
    } else {
      // Create payment details
      const paymentRes = await client.query(
        `INSERT INTO payment_details (payment_method, account_holder_name, bank_account_number, ifsc_code, settlement_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ["bank_transfer", "Khushi's Zone", "XXXXXXXXXXXX", "XXXX0000000", "Dummy payment details for default manufacturer"]
      );
      paymentId = paymentRes.rows[0].id;

      // Create manufacturer
      const manufacturerRes = await client.query(
        `INSERT INTO manufacturer_details (
          shop_name, owner_name, personal_number, email, shop_type, cod_allowed,
          payment_details_id, pickup_address, city, state, postal_code, country, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          "Khushi's Zone Default Manufacturer",
          "Default Owner",
          "+91 9999999999",
          "manufacturer@khushizone.com",
          "Clothing",
          true,
          paymentId,
          "Default Warehouse Address",
          "Delhi",
          "Delhi",
          "110001",
          "India",
          true
        ]
      );
      manufacturerId = manufacturerRes.rows[0].id;
      console.log("Created dummy manufacturer:", manufacturerId);
    }

    // Assign manufacturer to all items without manufacturer
    const result = await client.query(
      `UPDATE items SET manufacturer_id = $1 WHERE manufacturer_id IS NULL`,
      [manufacturerId]
    );
    console.log(`Assigned manufacturer to ${result.rowCount} products`);

    await client.query("COMMIT");
    console.log("Seed completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed error:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedManufacturer()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedManufacturer };
