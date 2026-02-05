const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');
const yahooFinanceService = require('../services/yahooFinanceService');

/**
 * Load quarterly financial data for all stocks in the database
 * Fetches income statement data from Yahoo Finance and populates quarterly_financials table
 */
async function loadQuarterlyFinancials() {
  console.log('🚀 Loading Quarterly Financials Data...\n');
  
  try {
    // Get all active stocks from database
    const stocksResult = await pool.query(
      'SELECT symbol FROM stocks WHERE is_active = TRUE ORDER BY symbol'
    );
    const stocks = stocksResult.rows;
    
    console.log(`Found ${stocks.length} stocks to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const progress = `[${i + 1}/${stocks.length}]`;
      
      try {
        console.log(`${progress} Processing ${stock.symbol}...`);
        
        // Fetch quarterly financial data from Yahoo Finance
        const financials = await yahooFinanceService.getQuarterlyFinancials(stock.symbol);
        
        if (!financials || financials.length === 0) {
          console.log(`  ⚠️  No quarterly data available for ${stock.symbol}`);
          errorCount++;
          await yahooFinanceService.delay(500);
          continue;
        }
        
        // Insert each quarter's data
        for (const quarter of financials) {
          await pool.query(
            `INSERT INTO quarterly_financials 
            (symbol, quarter, revenue, net_income, gross_profit, operating_income, ebitda, 
             eps, gross_margin, operating_margin, net_margin, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            ON CONFLICT (symbol, quarter) 
            DO UPDATE SET 
              revenue = EXCLUDED.revenue,
              net_income = EXCLUDED.net_income,
              gross_profit = EXCLUDED.gross_profit,
              operating_income = EXCLUDED.operating_income,
              ebitda = EXCLUDED.ebitda,
              eps = EXCLUDED.eps,
              gross_margin = EXCLUDED.gross_margin,
              operating_margin = EXCLUDED.operating_margin,
              net_margin = EXCLUDED.net_margin,
              updated_at = NOW()`,
            [
              stock.symbol,
              quarter.quarter,
              quarter.revenue,
              quarter.net_income,
              quarter.gross_profit,
              quarter.operating_income,
              quarter.ebitda,
              quarter.eps,
              quarter.gross_margin,
              quarter.operating_margin,
              quarter.net_margin
            ]
          );
        }
        
        console.log(`  ✅ ${stock.symbol} - Loaded ${financials.length} quarters`);
        successCount++;
        
        // Small delay to be polite
        if (i < stocks.length - 1) {
          await yahooFinanceService.delay(1000);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${stock.symbol}:`, error.message);
        errorCount++;
        await yahooFinanceService.delay(1000);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 QUARTERLY FINANCIALS LOADING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully loaded: ${successCount} stocks`);
    console.log(`❌ Failed: ${errorCount} stocks`);
    
    // Show total records
    const countResult = await pool.query('SELECT COUNT(*) as total FROM quarterly_financials');
    console.log(`\n🎉 Total quarterly records in database: ${countResult.rows[0].total}`);
    
    // Show sample data
    const sampleResult = await pool.query(`
      SELECT s.symbol, qf.quarter, qf.revenue, qf.net_income, qf.gross_margin 
      FROM quarterly_financials qf 
      JOIN stocks s ON s.symbol = qf.symbol 
      ORDER BY qf.quarter DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample Data:');
    console.table(sampleResult.rows);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  loadQuarterlyFinancials();
}

module.exports = { loadQuarterlyFinancials };
