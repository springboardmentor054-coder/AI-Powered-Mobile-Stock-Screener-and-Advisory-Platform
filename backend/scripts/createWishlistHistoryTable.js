require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function createWishlistHistoryTable() {
  const query = `
    -- Table to store daily snapshots of wishlisted stocks
    CREATE TABLE IF NOT EXISTS wishlist_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol) ON DELETE CASCADE,
      snapshot_date DATE NOT NULL,
      
      -- Price data
      current_price FLOAT,
      open_price FLOAT,
      high_price FLOAT,
      low_price FLOAT,
      volume BIGINT,
      
      -- Fundamental data
      pe_ratio FLOAT,
      pb_ratio FLOAT,
      eps FLOAT,
      dividend_yield FLOAT,
      market_cap BIGINT,
      
      -- Change metrics (calculated vs previous day)
      price_change FLOAT,
      price_change_percentage FLOAT,
      volume_change_percentage FLOAT,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, symbol, snapshot_date)
    );

    -- Indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_wishlist_history_user_symbol 
      ON wishlist_history(user_id, symbol);
    
    CREATE INDEX IF NOT EXISTS idx_wishlist_history_date 
      ON wishlist_history(snapshot_date DESC);
    
    CREATE INDEX IF NOT EXISTS idx_wishlist_history_user_date 
      ON wishlist_history(user_id, snapshot_date DESC);
  `;

  try {
    await pool.query(query);
    console.log('✅ Wishlist history table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating wishlist history table:', error);
    process.exit(1);
  }
}

createWishlistHistoryTable();
