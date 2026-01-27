const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkLastUpdate() {
  try {
    console.log('🔍 Checking last data update times...\n');

    // Check fundamentals table
    const fundamentalsQuery = `
      SELECT MAX(updated_at) as last_update, COUNT(*) as total_records
      FROM fundamentals
    `;
    const fundamentals = await pool.query(fundamentalsQuery);
    
    // Check shareholding table
    const shareholdingQuery = `
      SELECT MAX(last_updated) as last_update, COUNT(*) as total_records
      FROM shareholding
    `;
    const shareholding = await pool.query(shareholdingQuery);

    // Check stocks table count
    const stocksQuery = `
      SELECT COUNT(*) as total_records
      FROM stocks
    `;
    const stocks = await pool.query(stocksQuery);

    // Check corporate actions
    const corporateActionsQuery = `
      SELECT MAX(announcement_date) as last_announcement, COUNT(*) as total_records
      FROM corporate_actions
    `;
    const corporateActions = await pool.query(corporateActionsQuery);

    // Check financials
    const financialsQuery = `
      SELECT COUNT(*) as total_records, MAX(period) as latest_period
      FROM financials
    `;
    const financials = await pool.query(financialsQuery);

    // Check earnings data
    const earningsQuery = `
      SELECT COUNT(*) as total_records
      FROM earnings_analyst_data
    `;
    const earnings = await pool.query(earningsQuery);

    // Display results
    console.log('📊 DATA UPDATE SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n📈 STOCKS:');
    console.log(`   Total Records: ${stocks.rows[0].total_records}`);
    
    console.log('\n💰 FUNDAMENTALS:');
    console.log(`   Total Records: ${fundamentals.rows[0].total_records}`);
    console.log(`   Last Updated: ${fundamentals.rows[0].last_update || 'No data'}`);
    
    console.log('\n👥 SHAREHOLDING:');
    console.log(`   Total Records: ${shareholding.rows[0].total_records}`);
    console.log(`   Last Updated: ${shareholding.rows[0].last_update || 'No data'}`);
    
    console.log('\n📢 CORPORATE ACTIONS:');
    console.log(`   Total Records: ${corporateActions.rows[0].total_records}`);
    console.log(`   Last Announcement: ${corporateActions.rows[0].last_announcement || 'No data'}`);
    
    console.log('\n📊 FINANCIALS:');
    console.log(`   Total Records: ${financials.rows[0].total_records}`);
    console.log(`   Latest Period: ${financials.rows[0].latest_period || 'No data'}`);
    
    console.log('\n📅 EARNINGS DATA:');
    console.log(`   Total Records: ${earnings.rows[0].total_records}`);
    
    console.log('\n' + '='.repeat(60));

    // Calculate days since last update
    if (fundamentals.rows[0].last_update) {
      const lastUpdate = new Date(fundamentals.rows[0].last_update);
      const today = new Date();
      const daysSince = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
      
      console.log(`\n⏰ Days since last fundamentals update: ${daysSince} days`);
      
      if (daysSince > 7) {
        console.log('⚠️  Warning: Data is more than a week old. Consider updating.');
      } else if (daysSince > 1) {
        console.log('ℹ️  Data is recent but could be refreshed.');
      } else {
        console.log('✅ Data is fresh!');
      }
    }

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await pool.end();
  }
}

checkLastUpdate();
