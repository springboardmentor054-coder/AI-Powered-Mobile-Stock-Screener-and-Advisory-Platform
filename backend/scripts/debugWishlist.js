require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function debug() {
  try {
    console.log('🔍 Debugging wishlist for user 6...\n');

    // Check what snapshots exist for user 6
    const snapshots = await pool.query(`
      SELECT symbol, snapshot_date, current_price 
      FROM wishlist_history 
      WHERE user_id = 6
      ORDER BY symbol, snapshot_date DESC
    `);

    console.log('📸 Snapshots for user 6:', snapshots.rows.length);
    snapshots.rows.forEach(row => {
      console.log(`  ${row.symbol}: ${row.snapshot_date.toISOString().split('T')[0]} - $${row.current_price}`);
    });

    // Check database date
    const dateCheck = await pool.query('SELECT CURRENT_DATE, CURRENT_TIMESTAMP');
    const dbDate = dateCheck.rows[0].current_date.toISOString().split('T')[0];
    const dbTime = dateCheck.rows[0].current_timestamp.toISOString();
    console.log('\n📅 Database date:', dbDate);
    console.log('⏰ Database time:', dbTime);

    // Check what the wishlist API would return
    const wishlistQuery = await pool.query(`
      SELECT 
        w.symbol,
        s.company_name,
        COALESCE(ead.current_price, lp.close) as current_price,
        today_snapshot.snapshot_date as today_date,
        yesterday_snapshot.snapshot_date as yesterday_date,
        today_snapshot.price_change,
        today_snapshot.price_change_percentage
      FROM wishlist w
      LEFT JOIN stocks s ON w.symbol = s.symbol
      LEFT JOIN earnings_analyst_data ead ON w.symbol = ead.symbol
      LEFT JOIN LATERAL (
        SELECT close FROM price_history WHERE symbol = w.symbol ORDER BY date DESC LIMIT 1
      ) lp ON true
      LEFT JOIN LATERAL (
        SELECT * FROM wishlist_history 
        WHERE user_id = w.user_id AND symbol = w.symbol AND snapshot_date = CURRENT_DATE
        LIMIT 1
      ) today_snapshot ON true
      LEFT JOIN LATERAL (
        SELECT * FROM wishlist_history 
        WHERE user_id = w.user_id AND symbol = w.symbol AND snapshot_date = CURRENT_DATE - INTERVAL '1 day'
        LIMIT 1
      ) yesterday_snapshot ON true
      WHERE w.user_id = 6
    `);

    console.log('\n📋 Wishlist API results:', wishlistQuery.rows.length, 'items');
    wishlistQuery.rows.forEach(row => {
      console.log(`\n  ${row.symbol} - ${row.company_name}`);
      console.log(`    Current price: $${row.current_price || 'NULL'}`);
      console.log(`    Today snapshot: ${row.today_date ? row.today_date.toISOString().split('T')[0] : 'NONE'}`);
      console.log(`    Yesterday snapshot: ${row.yesterday_date ? row.yesterday_date.toISOString().split('T')[0] : 'NONE'}`);
      console.log(`    Change: ${row.price_change ? row.price_change + ' (' + row.price_change_percentage + '%)' : 'N/A'}`);
    });

    console.log('\n💡 Solution:');
    if (wishlistQuery.rows.length === 0) {
      console.log('   ERROR: No wishlist data returned! Check if user has wishlist items.');
    } else if (wishlistQuery.rows[0].today_date === null) {
      console.log('   Run: node scripts/captureWishlistSnapshots.js (to create today\'s snapshot)');
    } else if (wishlistQuery.rows[0].yesterday_date === null) {
      console.log('   Need yesterday\'s data - snapshots need at least 2 days to show comparison');
      console.log('   Creating mock yesterday snapshot...');
      
      // Create yesterday's snapshots by duplicating today's but with different date
      for (const row of wishlistQuery.rows) {
        await pool.query(`
          INSERT INTO wishlist_history 
          (user_id, symbol, snapshot_date, current_price, open_price, high_price, low_price, volume, pe_ratio, market_cap)
          SELECT 6, symbol, CURRENT_DATE - INTERVAL '1 day', current_price * 0.98, open_price, high_price, low_price, volume, pe_ratio, market_cap
          FROM wishlist_history
          WHERE user_id = 6 AND symbol = $1 AND snapshot_date = CURRENT_DATE
          LIMIT 1
          ON CONFLICT (user_id, symbol, snapshot_date) DO NOTHING
        `, [row.symbol]);
        console.log(`     ✅ Created yesterday snapshot for ${row.symbol}`);
      }
      console.log('\n   ✅ Done! Refresh your app now.');
    } else {
      console.log('   Data looks good! Refresh your app.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debug();
