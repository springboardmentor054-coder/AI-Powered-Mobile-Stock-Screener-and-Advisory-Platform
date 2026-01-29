// backend/config/db.js
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "saryugundimeda",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stocks_screener",
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.stack);
  } else {
    console.log("Connected to PostgreSQL database");
    release();
  }
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

module.exports = pool;