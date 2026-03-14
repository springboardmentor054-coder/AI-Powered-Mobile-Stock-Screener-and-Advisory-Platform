require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkVolumeData() {
  try {
    // Check latest price_history entries
    console.log('\n📊 Latest Price History for MSFT:\n');
    const priceHistory = await pool.query(`
      SELECT date, close, volume 
      FROM price_history 
      WHERE symbol = 'MSFT' 
      ORDER BY date DESC 
      LIMIT 5
    `);
    console.table(priceHistory.rows);
    
    // Check wishlist snapshots
    console.log('\n📸 Wishlist Snapshots for MSFT:\n');
    const snapshots = await pool.query(`
      SELECT 
        snapshot_date,
        current_price,
        volume,
        volume_change_percentage
      FROM wishlist_history 
      WHERE symbol = 'MSFT' 
      ORDER BY snapshot_date DESC
    `);
    console.table(snapshots.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVolumeData();
