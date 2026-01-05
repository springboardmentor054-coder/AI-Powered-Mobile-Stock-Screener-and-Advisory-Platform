// backend/db.js
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Check connection immediately
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL successfully!'))
  .catch(err => console.error('❌ Database connection error:', err.stack));

module.exports = {
  query: (text, params) => pool.query(text, params),
};