require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function viewPriceHistory() {
  try {
    // Get count of total records
    const countResult = await pool.query('SELECT COUNT(*) as total FROM price_history');
    console.log(`\n📊 Total price history records: ${countResult.rows[0].total}\n`);

    // Get symbols with data
    const symbolsResult = await pool.query(`
      SELECT symbol, COUNT(*) as record_count, 
             MIN(date) as earliest_date, 
             MAX(date) as latest_date
      FROM price_history 
      GROUP BY symbol 
      ORDER BY symbol
      LIMIT 10
    `);

    console.log('Symbols with price history:');
    symbolsResult.rows.forEach(row => {
      console.log(`  ${row.symbol}: ${row.record_count} records (${row.earliest_date.toISOString().split('T')[0]} to ${row.latest_date.toISOString().split('T')[0]})`);
    });

    // Get recent entries
    const recentResult = await pool.query(`
      SELECT symbol, date, open, high, low, close, volume
      FROM price_history
      ORDER BY date DESC, symbol
      LIMIT 20
    `);

    console.log('\n📈 Most recent 20 entries:');
    recentResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.symbol} - ${row.date.toISOString().split('T')[0]}`);
      console.log(`   Open: $${row.open} | High: $${row.high} | Low: $${row.low} | Close: $${row.close}`);
      console.log(`   Volume: ${row.volume}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

viewPriceHistory();
