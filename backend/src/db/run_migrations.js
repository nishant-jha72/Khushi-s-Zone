const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");
const { seedManufacturer } = require("./seed_manufacturer");

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");
    const migrationPath = path.join(__dirname, "migrations", "001_add_manufacturers_payments_orders.sql");
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, "utf8");
      await client.query(sql);
      console.log("Migration applied successfully");
    }
    
    await client.release();
    
    console.log("Running seed...");
    await seedManufacturer();
    console.log("All done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

runMigrations();
