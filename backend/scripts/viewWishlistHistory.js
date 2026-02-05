require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function viewWishlistHistory() {
  try {
    console.log('📊 Wishlist History Data:\n');

    const result = await pool.query(`
      SELECT 
        symbol,
        snapshot_date,
        current_price,
        open_price,
        high_price,
        low_price,
        volume,
        pe_ratio,
        price_change,
        price_change_percentage,
        volume_change_percentage
      FROM wishlist_history
      ORDER BY snapshot_date DESC, symbol
    `);

    if (result.rows.length === 0) {
      console.log('No snapshot data found yet.');
    } else {
      console.table(result.rows);
      console.log(`\nTotal snapshots: ${result.rows.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewWishlistHistory();
