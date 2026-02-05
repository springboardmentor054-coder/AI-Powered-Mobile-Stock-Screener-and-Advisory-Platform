require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkEarningsData() {
  try {
    const query = `
      SELECT 
        symbol, 
        current_price,
        earnings_date,
        estimated_eps,
        expected_revenue,
        beat_probability,
        analyst_target_price_low,
        analyst_target_price_high,
        analyst_count,
        consensus_rating,
        previous_eps,
        eps_surprise
      FROM earnings_analyst_data 
      WHERE symbol IN ('AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA')
      ORDER BY symbol
    `;

    const result = await pool.query(query);
    console.log('📊 Sample Earnings Analyst Data:\n');
    console.table(result.rows);

    // Count nulls
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(current_price) as has_price,
        COUNT(earnings_date) as has_earnings_date,
        COUNT(estimated_eps) as has_estimated_eps,
        COUNT(analyst_count) as has_analyst_count,
        COUNT(consensus_rating) as has_consensus
      FROM earnings_analyst_data
    `;

    const stats = await pool.query(statsQuery);
    console.log('\n📈 Overall Statistics:');
    console.table(stats.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEarningsData();
