require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

/**
 * Fix earnings_analyst_data table by populating current_price from price_history
 * This ensures the table has usable data instead of all nulls
 */
async function fixEarningsAnalystData() {
  try {
    console.log('🔧 Fixing earnings_analyst_data table...\n');

    // Update current_price from latest price_history data
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
        AND ead.current_price IS NULL
    `;

    const result = await pool.query(updateQuery);
    console.log(`✅ Updated ${result.rowCount} stocks with current prices from price_history\n`);

    // Show sample of updated data
    const sampleQuery = `
      SELECT symbol, current_price, earnings_date, estimated_eps
      FROM earnings_analyst_data
      WHERE current_price IS NOT NULL
      ORDER BY symbol
      LIMIT 10
    `;

    const sample = await pool.query(sampleQuery);
    console.log('📊 Sample of updated data:');
    console.table(sample.rows);

    // Show statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_stocks,
        COUNT(current_price) as stocks_with_price,
        COUNT(earnings_date) as stocks_with_earnings_date,
        COUNT(estimated_eps) as stocks_with_eps_estimate
      FROM earnings_analyst_data
    `;

    const stats = await pool.query(statsQuery);
    console.log('\n📈 Table Statistics:');
    console.table(stats.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixEarningsAnalystData();
