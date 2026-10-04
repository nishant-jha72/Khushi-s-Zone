const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { seedData } = require("../db/seed");

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();

    console.log(
      `📡 Connected to PostgreSQL database "${process.env.DB_NAME}" as user "${process.env.DB_USER}"`,
    );

    const schemaPath = path.join(__dirname, "../db/schema.sql");

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await client.query(schemaSql);
      console.log("⚙️ Database schema verified.");
    }

    client.release();

    await seedData(pool);
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initializeDatabase,
};
