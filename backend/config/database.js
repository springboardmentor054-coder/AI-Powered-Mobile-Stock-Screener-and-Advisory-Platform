const { Pool } = require("pg");

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on("connect", () => {
  console.log("✓ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

/**
 * Execute a query with parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Query executed:", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await query("SELECT NOW() as current_time");
    console.log("Database connection test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error.message);
    return false;
  }
}

module.exports = {
  query,
  getClient,
  pool,
  testConnection
};
