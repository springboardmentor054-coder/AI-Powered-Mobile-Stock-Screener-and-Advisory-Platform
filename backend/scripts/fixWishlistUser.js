require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function addWishlistForUser6() {
  try {
    console.log('📝 Adding wishlist items to user 6...\n');

    const stocks = ['AAL', 'AAPL', 'AFL', 'MSFT'];
    let addedCount = 0;

    for (const symbol of stocks) {
      const result = await pool.query(`
        INSERT INTO wishlist (user_id, symbol) 
        VALUES ($1, $2) 
        ON CONFLICT (user_id, symbol) DO NOTHING
        RETURNING *
      `, [6, symbol]);

      if (result.rows.length > 0) {
        console.log(`✅ Added ${symbol} to wishlist`);
        addedCount++;
      } else {
        console.log(`ℹ️  ${symbol} already in wishlist`);
      }
    }

    console.log(`\n✅ Done! Added ${addedCount} new items to wishlist.`);
    console.log('\n💡 Now run: node scripts/captureWishlistSnapshots.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addWishlistForUser6();
