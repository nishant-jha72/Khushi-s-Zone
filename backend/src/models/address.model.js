const { query, pool } = require("../config/db");

function formatAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    alternatePhoneNumber: row.alternate_phone_number || "",
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 || "",
    landmark: row.landmark || "",
    city: row.city,
    district: row.district || "",
    state: row.state,
    postalCode: row.postal_code,
    country: row.country || "India",
    latitude: row.latitude !== null && row.latitude !== undefined ? parseFloat(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? parseFloat(row.longitude) : null,
    formattedAddress: row.formatted_address || "",
    addressType: row.address_type || "Home",
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByUser(userId) {
  const result = await query(
    `SELECT * FROM user_address
     WHERE user_id = $1
     ORDER BY is_default DESC, updated_at DESC, id DESC;`,
    [userId]
  );
  return result.rows.map(formatAddress);
}

async function findByIdForUser(id, userId) {
  const result = await query(
    "SELECT * FROM user_address WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return formatAddress(result.rows[0]);
}

async function countByUser(userId) {
  const result = await query(
    "SELECT COUNT(*)::int AS count FROM user_address WHERE user_id = $1",
    [userId]
  );
  return result.rows[0].count;
}

async function create(userId, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT COUNT(*)::int AS count FROM user_address WHERE user_id = $1",
      [userId]
    );
    const isFirst = existing.rows[0].count === 0;
    const makeDefault = isFirst || Boolean(data.is_default);

    if (makeDefault) {
      await client.query(
        "UPDATE user_address SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
        [userId]
      );
    }

    const inserted = await client.query(
      `INSERT INTO user_address (
         user_id, full_name, phone_number, alternate_phone_number,
         address_line1, address_line2, landmark, city, district, state,
         postal_code, country, latitude, longitude, formatted_address,
         address_type, is_default
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
       )
       RETURNING *;`,
      [
        userId,
        data.full_name,
        data.phone_number,
        data.alternate_phone_number || "",
        data.address_line1,
        data.address_line2 || "",
        data.landmark || "",
        data.city,
        data.district || "",
        data.state,
        data.postal_code,
        data.country || "India",
        data.latitude,
        data.longitude,
        data.formatted_address || "",
        data.address_type || "Home",
        makeDefault,
      ]
    );

    await client.query("COMMIT");
    return formatAddress(inserted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function update(id, userId, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT * FROM user_address WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const makeDefault = data.is_default === true;
    if (makeDefault) {
      await client.query(
        "UPDATE user_address SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id <> $2",
        [userId, id]
      );
    }

    const updated = await client.query(
      `UPDATE user_address SET
         full_name = COALESCE($1, full_name),
         phone_number = COALESCE($2, phone_number),
         alternate_phone_number = COALESCE($3, alternate_phone_number),
         address_line1 = COALESCE($4, address_line1),
         address_line2 = COALESCE($5, address_line2),
         landmark = COALESCE($6, landmark),
         city = COALESCE($7, city),
         district = COALESCE($8, district),
         state = COALESCE($9, state),
         postal_code = COALESCE($10, postal_code),
         country = COALESCE($11, country),
         latitude = COALESCE($12, latitude),
         longitude = COALESCE($13, longitude),
         formatted_address = COALESCE($14, formatted_address),
         address_type = COALESCE($15, address_type),
         is_default = CASE WHEN $16 THEN TRUE ELSE is_default END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $17 AND user_id = $18
       RETURNING *;`,
      [
        data.full_name,
        data.phone_number,
        data.alternate_phone_number,
        data.address_line1,
        data.address_line2,
        data.landmark,
        data.city,
        data.district,
        data.state,
        data.postal_code,
        data.country,
        data.latitude,
        data.longitude,
        data.formatted_address,
        data.address_type,
        makeDefault,
        id,
        userId,
      ]
    );

    await client.query("COMMIT");
    return formatAddress(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function remove(id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT * FROM user_address WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const wasDefault = existing.rows[0].is_default;
    await client.query("DELETE FROM user_address WHERE id = $1 AND user_id = $2", [id, userId]);

    if (wasDefault) {
      await client.query(
        `UPDATE user_address
         SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = (
           SELECT id FROM user_address
           WHERE user_id = $1
           ORDER BY updated_at DESC, id DESC
           LIMIT 1
         )`,
        [userId]
      );
    }

    await client.query("COMMIT");
    return formatAddress(existing.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function setDefault(id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM user_address WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      "UPDATE user_address SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
      [userId]
    );
    const updated = await client.query(
      `UPDATE user_address
       SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *;`,
      [id, userId]
    );

    await client.query("COMMIT");
    return formatAddress(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  formatAddress,
  listByUser,
  findByIdForUser,
  countByUser,
  create,
  update,
  remove,
  setDefault,
};
