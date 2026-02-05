const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');
const { getHistoricalPrices } = require('../services/yahooFinanceService');
const { batchInsertPriceHistory } = require('../services/stockDataService');

/**
 * Load historical price data for all stocks in the database
 * Default: Load last 90 days of data
 */

async function loadHistoricalPrices(daysBack = 90) {
  try {
    console.log('📈 Starting Historical Price Data Loading');
    console.log('='.repeat(60));
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const period1 = startDate.toISOString().split('T')[0];
    const period2 = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${period1} to ${period2} (${daysBack} days)`);
    console.log();
    
    // Get all active stocks with exchange info
    const result = await db.query(`
      SELECT symbol, company_name, exchange 
      FROM stocks 
      WHERE is_active = true 
      ORDER BY symbol
    `);
    
    const stocks = result.rows;
    console.log(`📊 Found ${stocks.length} active stocks to process`);
    console.log();
    
    let successCount = 0;
    let errorCount = 0;
    let totalRecords = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const progress = `[${i + 1}/${stocks.length}]`;
      
      console.log(`${progress} Processing ${stock.symbol} - ${stock.company_name}`);
      
      try {
        // Fetch historical data from Yahoo Finance
        // Determine the correct Yahoo Finance symbol based on exchange
        let yahooSymbol = stock.symbol;
        
        if (!stock.symbol.includes('.')) {
          // Add exchange suffix if not already present
          if (stock.exchange === 'NSE' || stock.exchange === 'BSE') {
            // Indian stocks - try NSE first, fallback to BSE
            yahooSymbol = `${stock.symbol}.NS`;
          } else if (stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE' || !stock.exchange) {
            // US stocks - no suffix needed
            yahooSymbol = stock.symbol;
          } else {
            // For other exchanges, use symbol as-is
            yahooSymbol = stock.symbol;
          }
        }
        
        const priceData = await getHistoricalPrices(yahooSymbol, period1, period2);
        
        if (priceData && priceData.length > 0) {
          // Insert into database
          const { inserted, updated } = await batchInsertPriceHistory(priceData);
          
          console.log(`  ✅ Loaded ${priceData.length} days (${inserted} new, ${updated} updated)`);
          successCount++;
          totalRecords += inserted;
        } else {
          console.log(`  ⚠️  No data available`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      }
      
      // Small delay to be respectful to Yahoo Finance
      if (i < stocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log('📊 LOADING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully loaded: ${successCount} stocks`);
    console.log(`❌ Failed/No data: ${errorCount} stocks`);
    console.log(`📈 Total price records: ${totalRecords}`);
    
    // Show summary
    const summaryResult = await db.query(`
      SELECT 
        COUNT(DISTINCT symbol) as total_stocks,
        COUNT(*) as total_records,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM price_history
    `);
    
    const summary = summaryResult.rows[0];
    console.log();
    console.log('📊 Database Summary:');
    console.log(`   Stocks with price data: ${summary.total_stocks}`);
    console.log(`   Total price records: ${summary.total_records}`);
    console.log(`   Date range: ${summary.earliest_date} to ${summary.latest_date}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Update historical data for a single stock
 */
async function updateStockHistory(symbol, daysBack = 90) {
  try {
    console.log(`📈 Updating historical data for ${symbol}...`);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const period1 = startDate.toISOString().split('T')[0];
    const period2 = endDate.toISOString().split('T')[0];
    
    // Get exchange info for the stock
    const stockInfo = await db.query(`
      SELECT exchange FROM stocks WHERE symbol = $1
    `, [symbol.replace('.NS', '').replace('.BO', '')]);
    
    let yahooSymbol = symbol;
    if (stockInfo.rows.length > 0 && !symbol.includes('.')) {
      const exchange = stockInfo.rows[0].exchange;
      if (exchange === 'NSE' || exchange === 'BSE') {
        yahooSymbol = `${symbol}.NS`;
      }
    }
    
    const priceData = await getHistoricalPrices(yahooSymbol, period1, period2);
    
    if (priceData && priceData.length > 0) {
      const { inserted, updated } = await batchInsertPriceHistory(priceData);
      console.log(`✅ Updated ${symbol}: ${priceData.length} days (${inserted} new, ${updated} updated)`);
      return { success: true, records: priceData.length };
    } else {
      console.log(`⚠️  No data available for ${symbol}`);
      return { success: false, records: 0 };
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${symbol}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Update specific stock
    const symbol = args[0];
    const days = args[1] ? parseInt(args[1]) : 90;
    
    updateStockHistory(symbol, days)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    // Load all stocks
    const days = 90; // Default 90 days
    loadHistoricalPrices(days);
  }
}

module.exports = {
  loadHistoricalPrices,
  updateStockHistory
};
