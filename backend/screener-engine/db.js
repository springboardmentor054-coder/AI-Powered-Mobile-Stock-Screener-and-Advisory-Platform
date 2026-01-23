const { Pool } = require('pg');

const pool = new Pool({
  user: "stockuser",
  password: "stock123",
  host: "localhost",
  port: 5432,
  database: "stockdb"
});

module.exports = pool;
