const db = require("../config/db"); // PostgreSQL pool connection

class NewsletterModel {
  static async subscribe(email) {
    const query = `
      INSERT INTO newsletters (email, is_active, unsubscribed_at) 
      VALUES ($1, TRUE, NULL)
      ON CONFLICT (email) 
      DO UPDATE SET 
        is_active = TRUE, 
        unsubscribed_at = NULL;
    `;
    const result = await db.query(query, [email]);
    return result;
  }

  static async unsubscribe(email) {
    const query = `
      UPDATE newsletters 
      SET is_active = FALSE, unsubscribed_at = CURRENT_TIMESTAMP 
      WHERE email = $1;
    `;
    const result = await db.query(query, [email]);
    return result.rowCount; // Returns number of affected rows
  }

  static async getActiveSubscribers() {
    const query = `
      SELECT email 
      FROM newsletters 
      WHERE is_active = TRUE;
    `;
    const result = await db.query(query);
    return result.rows; // Returns the array of subscriber objects
  }
}

module.exports = NewsletterModel;
