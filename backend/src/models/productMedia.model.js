const { query, pool } = require("../config/db");

async function checkProductExists(productId) {
  const result = await query("SELECT id FROM items WHERE id = $1", [productId]);
  return result.rows.length > 0;
}

async function insertProductMedia({ productId, mediaType, mediaUrl, publicId, altText, sortOrder, isPrimary }) {
  const result = await query(
    `INSERT INTO product_media (product_id, media_type, media_url, public_id, alt_text, sort_order, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, product_id AS "productId", media_type AS "mediaType", media_url AS "mediaUrl", public_id AS "publicId", alt_text AS "altText", sort_order AS "sortOrder", is_primary AS "isPrimary", created_at AS "createdAt", updated_at AS "updatedAt";`,
    [productId, mediaType, mediaUrl, publicId, altText || null, sortOrder || 0, isPrimary || false]
  );
  return result.rows[0];
}

async function getMediaByProductId(productId) {
  const result = await query(
    `SELECT id, product_id AS "productId", media_type AS "mediaType", media_url AS "mediaUrl", public_id AS "publicId", alt_text AS "altText", sort_order AS "sortOrder", is_primary AS "isPrimary", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM product_media
     WHERE product_id = $1
     ORDER BY sort_order ASC, created_at ASC;`,
    [productId]
  );
  return result.rows;
}

async function getMediaByIdAndProduct(mediaId, productId) {
  const result = await query(
    `SELECT id, product_id AS "productId", media_type AS "mediaType", media_url AS "mediaUrl", public_id AS "publicId", alt_text AS "altText", sort_order AS "sortOrder", is_primary AS "isPrimary"
     FROM product_media
     WHERE id = $1 AND product_id = $2;`,
    [mediaId, productId]
  );
  return result.rows[0] || null;
}

async function updateMediaMetadata(mediaId, productId, { altText, sortOrder, isPrimary }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (isPrimary === true) {
      // Unset is_primary for other media of the same product
      await client.query(
        `UPDATE product_media
         SET is_primary = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $1 AND media_type = 'image';`,
        [productId]
      );
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (altText !== undefined) {
      params.push(altText);
      updates.push(`alt_text = $${paramIndex++}`);
    }

    if (sortOrder !== undefined) {
      params.push(sortOrder);
      updates.push(`sort_order = $${paramIndex++}`);
    }

    if (isPrimary !== undefined) {
      params.push(isPrimary);
      updates.push(`is_primary = $${paramIndex++}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(mediaId);
    params.push(productId);

    const updateSql = `
      UPDATE product_media
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex++} AND product_id = $${paramIndex++}
      RETURNING id, product_id AS "productId", media_type AS "mediaType", media_url AS "mediaUrl", public_id AS "publicId", alt_text AS "altText", sort_order AS "sortOrder", is_primary AS "isPrimary", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    const res = await client.query(updateSql, params);
    await client.query("COMMIT");
    return res.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteMediaRecord(mediaId, productId) {
  const result = await query(
    `DELETE FROM product_media
     WHERE id = $1 AND product_id = $2
     RETURNING id;`,
    [mediaId, productId]
  );
  return result.rows.length > 0;
}

async function getNextSortOrder(productId) {
  const result = await query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS "nextSortOrder"
     FROM product_media
     WHERE product_id = $1;`,
    [productId]
  );
  return parseInt(result.rows[0].nextSortOrder, 10);
}

async function countImagesByProductId(productId) {
  const result = await query(
    `SELECT COUNT(*) AS total
     FROM product_media
     WHERE product_id = $1 AND media_type = 'image';`,
    [productId]
  );
  return parseInt(result.rows[0].total, 10);
}

module.exports = {
  checkProductExists,
  insertProductMedia,
  getMediaByProductId,
  getMediaByIdAndProduct,
  updateMediaMetadata,
  deleteMediaRecord,
  getNextSortOrder,
  countImagesByProductId,
};

