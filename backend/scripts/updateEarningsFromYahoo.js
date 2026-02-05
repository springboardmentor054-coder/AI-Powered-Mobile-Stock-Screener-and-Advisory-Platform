require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');
const yahooFinanceService = require('../services/yahooFinanceService');
const stockDataService = require('../services/stockDataService');

/**
 * Update earnings and analyst data for all stocks from Yahoo Finance
 * This populates the remaining null fields in earnings_analyst_data table
 */
async function updateEarningsAnalystData() {
  try {
    console.log('🔄 Updating Earnings & Analyst Data from Yahoo Finance...\n');
    
    // Get all stock symbols
    const result = await pool.query('SELECT symbol FROM stocks WHERE is_active = true ORDER BY symbol');
    const stocks = result.rows;
    
    console.log(`Found ${stocks.length} stocks to update`);
    console.log('This will take some time (about 1-2 seconds per stock)...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let updatedFields = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const progress = `[${i + 1}/${stocks.length}]`;
      
      try {
        console.log(`${progress} Fetching ${stock.symbol}...`);
        
        // Fetch comprehensive earnings and analyst data from Yahoo Finance
        const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(stock.symbol);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update earnings analyst data
        await stockDataService.upsertEarningsAnalystData({
          symbol: stock.symbol,
          earningsDate: yahooData.earningsDate || null,
          estimatedEps: yahooData.estimatedEps || null,
          expectedRevenue: yahooData.expectedRevenue || null,
          beatProbability: yahooData.beatProbability || null,
          analystTargetPriceLow: yahooData.analystTargetPriceLow || null,
          analystTargetPriceHigh: yahooData.analystTargetPriceHigh || null,
          currentPrice: yahooData.currentPrice || null,
          previousEps: yahooData.previousEps || null,
          epsSurprise: yahooData.epsSurprise || null,
          epsSurprisePercentage: yahooData.epsSurprisePercentage || null,
          previousRevenue: null,
          revenueSurprise: null,
          revenueSurprisePercentage: null,
          analystCount: yahooData.analystCount || 0,
          strongBuyCount: yahooData.strongBuyCount || 0,
          buyCount: yahooData.buyCount || 0,
          holdCount: yahooData.holdCount || 0,
          sellCount: yahooData.sellCount || 0,
          strongSellCount: yahooData.strongSellCount || 0,
          consensusRating: yahooData.consensusRating || 'Hold'
        });
        
        // Count how many fields were actually populated
        const populated = [
          yahooData.earningsDate,
          yahooData.estimatedEps,
          yahooData.analystCount,
          yahooData.consensusRating,
          yahooData.analystTargetPriceLow,
          yahooData.analystTargetPriceHigh
        ].filter(v => v !== null && v !== undefined).length;
        
        if (populated > 0) {
          updatedFields += populated;
          console.log(`  ✅ ${stock.symbol} - Updated ${populated} fields`);
        } else {
          console.log(`  ⚠️  ${stock.symbol} - No additional data available`);
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ ${stock.symbol} - Error: ${error.message}`);
        errorCount++;
      }
      
      // Show progress every 10 stocks
      if ((i + 1) % 10 === 0) {
        console.log(`\n--- Progress: ${i + 1}/${stocks.length} (${((i + 1) / stocks.length * 100).toFixed(1)}%) ---\n`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount} stocks`);
    console.log(`❌ Errors: ${errorCount} stocks`);
    console.log(`📈 Total fields updated: ${updatedFields}`);
    console.log('='.repeat(60));
    
    // Show final statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(current_price) as has_price,
        COUNT(earnings_date) as has_earnings_date,
        COUNT(estimated_eps) as has_estimated_eps,
        COUNT(analyst_count) as has_analyst_count,
        COUNT(consensus_rating) as has_consensus,
        COUNT(analyst_target_price_high) as has_target_price
      FROM earnings_analyst_data
    `;
    
    const stats = await pool.query(statsQuery);
    console.log('\n📈 Final Table Statistics:');
    console.table(stats.rows);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

updateEarningsAnalystData();
