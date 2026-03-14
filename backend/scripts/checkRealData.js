require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkRealData() {
  try {
    // Clear test snapshots
    await pool.query('DELETE FROM wishlist_history WHERE user_id = 1');
    console.log('✅ Cleared test snapshots\n');

    // Check current prices
    console.log('💰 Real current prices in database:\n');
    const prices = await pool.query(`
      SELECT symbol, current_price
      FROM earnings_analyst_data
      WHERE symbol IN ('AAPL', 'MSFT')
    `);
    console.table(prices.rows);

    console.log('\n📊 Latest price history dates:\n');
    const history = await pool.query(`
      SELECT symbol, MAX(date) as latest_date, close as latest_price
      FROM price_history
      WHERE symbol IN ('AAPL', 'MSFT')
      GROUP BY symbol, close
      ORDER BY symbol
      LIMIT 2
    `);
    console.table(history.rows);

    console.log('\n📝 Your real situation:');
    console.log('   - Latest data in price_history is from Jan 29, 2026');
    console.log('   - To see daily changes, you need data from different days');
    console.log('   - The system shows real data when available\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRealData();
