require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkAllSnapshots() {
  try {
    const query = `
      SELECT 
        symbol, 
        snapshot_date,
        current_price,
        volume,
        pe_ratio,
        price_change,
        price_change_percentage
      FROM wishlist_history 
      WHERE user_id = 1 
      ORDER BY symbol, snapshot_date DESC
    `;
    
    const result = await pool.query(query);
    
    console.log('\n📸 ALL Wishlist Snapshots:\n');
    console.table(result.rows);
    
    console.log(`\nTotal snapshots: ${result.rows.length}`);
    console.log(`Today's date: ${new Date().toISOString().split('T')[0]}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllSnapshots();
