require("dotenv").config();
const yahooFinanceService = require("./services/yahooFinanceService");
const stockDataService = require("./services/stockDataService");
const db = require("./config/database");

/**
 * Update earnings and analyst data for all existing stocks in the database
 * This script updates ONLY the earnings_analyst_data table
 */
async function updateEarningsData() {
  console.log("🔄 Updating earnings and analyst data for all stocks...\n");
  
  try {
    // Get all stocks from database
    const result = await db.query("SELECT symbol, company_name FROM stocks WHERE is_active = true ORDER BY symbol");
    const stocks = result.rows;
    
    console.log(`Found ${stocks.length} stocks to update\n`);
    
    let successful = 0;
    let failed = 0;
    let withData = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const { symbol, company_name } = stocks[i];
      
      console.log(`\n[${i + 1}/${stocks.length}] Updating ${symbol} (${company_name})...`);
      
      try {
        // Fetch Yahoo Finance data
        const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(symbol);
        
        // Update database
        await stockDataService.upsertEarningsAnalystData({
          symbol: symbol,
          earningsDate: yahooData.earningsDate,
          estimatedEps: yahooData.estimatedEps,
          expectedRevenue: yahooData.expectedRevenue,
          beatProbability: yahooData.beatProbability,
          analystTargetPriceLow: yahooData.analystTargetPriceLow,
          analystTargetPriceHigh: yahooData.analystTargetPriceHigh,
          currentPrice: yahooData.currentPrice,
          previousEps: yahooData.previousEps,
          epsSurprise: yahooData.epsSurprise,
          epsSurprisePercentage: yahooData.epsSurprisePercentage,
          previousRevenue: null, // Not provided by current implementation
          revenueSurprise: null,
          revenueSurprisePercentage: null,
          analystCount: yahooData.analystCount,
          strongBuyCount: yahooData.strongBuyCount,
          buyCount: yahooData.buyCount,
          holdCount: yahooData.holdCount,
          sellCount: yahooData.sellCount,
          strongSellCount: yahooData.strongSellCount,
          consensusRating: yahooData.consensusRating
        });
        
        // Check if we got real data
        const hasRealData = yahooData.earningsDate || yahooData.estimatedEps || yahooData.analystCount;
        if (hasRealData) {
          withData++;
          console.log(`  ✅ Updated with real data`);
          if (yahooData.earningsDate) console.log(`     📅 Earnings: ${yahooData.earningsDate.toISOString().split('T')[0]}`);
          if (yahooData.estimatedEps) console.log(`     💰 Est. EPS: ${yahooData.estimatedEps}`);
          if (yahooData.analystCount) console.log(`     👥 Analysts: ${yahooData.analystCount}`);
        } else {
          console.log(`  ⚠️  Updated but no data available (common for smaller stocks)`);
        }
        
        successful++;
        
        // Be polite with requests - 1 second delay
        await yahooFinanceService.delay(1000);
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${successful}`);
    console.log(`📈 With real data: ${withData}`);
    console.log(`⚠️  Without data: ${successful - withData}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${stocks.length}`);
    console.log("\n💡 Note: Some stocks may not have analyst coverage or upcoming earnings.");
    console.log("   This is normal, especially for smaller companies.");
    
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
  } finally {
    process.exit(0);
  }
}

// Run the update
updateEarningsData();
