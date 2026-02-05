require('dotenv').config();
const pool = require('../config/database');

async function createWishlistTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS wishlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(user_id, symbol)
    );

    CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_symbol ON wishlist(symbol);
  `;

  try {
    await pool.query(query);
    console.log('✅ Wishlist table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating wishlist table:', error);
    process.exit(1);
  }
}

createWishlistTable();
