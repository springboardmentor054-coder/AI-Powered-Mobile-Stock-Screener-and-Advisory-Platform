require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkWishlistData() {
  try {
    console.log('📋 Checking wishlist data...\n');

    // Check database current date
    const dateResult = await pool.query('SELECT CURRENT_DATE as today, CURRENT_TIMESTAMP as now');
    console.log('Database date:', dateResult.rows[0].today.toISOString().split('T')[0]);
    console.log('Database time:', dateResult.rows[0].now.toISOString());

    // Check latest snapshot date
    const snapshotResult = await pool.query('SELECT MAX(snapshot_date) as latest_snapshot FROM wishlist_history');
    console.log('Latest snapshot:', snapshotResult.rows[0].latest_snapshot ? snapshotResult.rows[0].latest_snapshot.toISOString().split('T')[0] : 'none');

    // Check wishlist entries
    const wishlistResult = await pool.query('SELECT user_id, symbol FROM wishlist ORDER BY symbol');
    console.log('\n📝 Wishlist entries:', wishlistResult.rows.length);
    wishlistResult.rows.forEach(row => {
      console.log(`  User ${row.user_id}: ${row.symbol}`);
    });

    // Check if today's snapshots exist
    const todaySnapshots = await pool.query(`
      SELECT symbol, snapshot_date, current_price 
      FROM wishlist_history 
      WHERE snapshot_date = CURRENT_DATE
    `);
    console.log('\n📸 Today\'s snapshots:', todaySnapshots.rows.length);
    if (todaySnapshots.rows.length > 0) {
      todaySnapshots.rows.forEach(row => {
        console.log(`  ${row.symbol}: $${row.current_price} (${row.snapshot_date.toISOString().split('T')[0]})`);
      });
    } else {
      console.log('  No snapshots for today yet!');
      console.log('  💡 Run: node scripts/captureWishlistSnapshots.js');
    }

    // Test the wishlist query
    const testQuery = `
      SELECT 
        w.symbol,
        s.company_name,
        COALESCE(ead.current_price, lp.close) as current_price,
        today.snapshot_date as has_today_data,
        yesterday.snapshot_date as has_yesterday_data
      FROM wishlist w
      LEFT JOIN stocks s ON w.symbol = s.symbol
      LEFT JOIN earnings_analyst_data ead ON w.symbol = ead.symbol
      LEFT JOIN LATERAL (
        SELECT close FROM price_history WHERE symbol = w.symbol ORDER BY date DESC LIMIT 1
      ) lp ON true
      LEFT JOIN LATERAL (
        SELECT snapshot_date FROM wishlist_history 
        WHERE user_id = w.user_id AND symbol = w.symbol AND snapshot_date = CURRENT_DATE
        LIMIT 1
      ) today ON true
      LEFT JOIN LATERAL (
        SELECT snapshot_date FROM wishlist_history 
        WHERE user_id = w.user_id AND symbol = w.symbol AND snapshot_date = CURRENT_DATE - INTERVAL '1 day'
        LIMIT 1
      ) yesterday ON true
      WHERE w.user_id = 6
      LIMIT 5
    `;

    const testResult = await pool.query(testQuery);
    console.log('\n🔍 Wishlist API test (first 5):');
    testResult.rows.forEach(row => {
      console.log(`  ${row.symbol} (${row.company_name})`);
      console.log(`    Price: $${row.current_price || 'N/A'}`);
      console.log(`    Today snapshot: ${row.has_today_data ? 'YES' : 'NO'}`);
      console.log(`    Yesterday snapshot: ${row.has_yesterday_data ? 'YES' : 'NO'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkWishlistData();
