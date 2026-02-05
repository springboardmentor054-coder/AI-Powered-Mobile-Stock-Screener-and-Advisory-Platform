const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function checkEarningsData() {
  try {
    console.log('Checking earnings_analyst_data table...\n');
    
    const result = await pool.query(`
      SELECT symbol, earnings_date, estimated_eps, expected_revenue, 
             analyst_count, consensus_rating, current_price,
             analyst_target_price_low, analyst_target_price_high
      FROM earnings_analyst_data 
      ORDER BY symbol
      LIMIT 20
    `);
    
    console.log(`Found ${result.rows.length} records\n`);
    console.table(result.rows);
    
    // Count nulls
    const nullCount = result.rows.filter(r => 
      !r.earnings_date && !r.estimated_eps && !r.analyst_count
    ).length;
    
    console.log(`\n${nullCount} out of ${result.rows.length} have all null values`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEarningsData();
