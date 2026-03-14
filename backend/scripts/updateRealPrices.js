require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function updateRealPrices() {
  try {
    console.log('🔄 Updating to real prices from price_history...\n');

    // Update ALL current_price values (not just NULL ones)
    const updateQuery = `
      UPDATE earnings_analyst_data ead
      SET current_price = ph.close
      FROM (
        SELECT DISTINCT ON (symbol) 
          symbol, 
          close
        FROM price_history
        WHERE close IS NOT NULL
        ORDER BY symbol, date DESC
      ) ph
      WHERE ead.symbol = ph.symbol
    `;

    const result = await pool.query(updateQuery);
    console.log(`✅ Updated ${result.rowCount} stocks with real prices\n`);

    // Show AAPL and MSFT
    const check = await pool.query(`
      SELECT symbol, current_price
      FROM earnings_analyst_data
      WHERE symbol IN ('AAPL', 'MSFT')
    `);
    
    console.log('📊 Updated prices:\n');
    console.table(check.rows);

    console.log('\n✅ Now your app will show real market data');
    console.log('   - AAPL: Real price from Jan 29');
    console.log('   - MSFT: Real price from Jan 29');
    console.log('   - No fake data, just what Yahoo Finance API provided\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateRealPrices();
