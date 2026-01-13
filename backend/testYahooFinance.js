const yahooFinanceService = require("./services/yahooFinanceService");

/**
 * Quick test to verify Yahoo Finance integration is working
 */
async function testYahooFinance() {
  console.log("🧪 Testing Yahoo Finance Integration...\n");
  
  const testSymbols = ["AAPL", "MSFT", "GOOGL"];
  
  for (const symbol of testSymbols) {
    console.log(`\n📊 Testing ${symbol}:`);
    console.log("=".repeat(50));
    
    try {
      const data = await yahooFinanceService.getComprehensiveEarningsAnalystData(symbol);
      
      console.log(`✅ Symbol: ${data.symbol}`);
      console.log(`📅 Earnings Date: ${data.earningsDate || "Not available"}`);
      console.log(`💰 Estimated EPS: ${data.estimatedEps || "N/A"}`);
      console.log(`📈 Expected Revenue: ${data.expectedRevenue ? "$" + (data.expectedRevenue / 1e9).toFixed(2) + "B" : "N/A"}`);
      console.log(`🎯 Beat Probability: ${data.beatProbability ? data.beatProbability.toFixed(1) + "%" : "N/A"}`);
      console.log(`💵 Current Price: $${data.currentPrice || "N/A"}`);
      console.log(`🎯 Target Low: $${data.analystTargetPriceLow || "N/A"}`);
      console.log(`🎯 Target High: $${data.analystTargetPriceHigh || "N/A"}`);
      console.log(`👥 Analyst Count: ${data.analystCount || 0}`);
      console.log(`📊 Consensus: ${data.consensusRating || "N/A"}`);
      console.log(`   - Strong Buy: ${data.strongBuyCount || 0}`);
      console.log(`   - Buy: ${data.buyCount || 0}`);
      console.log(`   - Hold: ${data.holdCount || 0}`);
      console.log(`   - Sell: ${data.sellCount || 0}`);
      console.log(`   - Strong Sell: ${data.strongSellCount || 0}`);
      
      // Check if we got any real data
      const hasData = data.earningsDate || data.estimatedEps || data.analystCount;
      if (hasData) {
        console.log(`\n✅ SUCCESS: Yahoo Finance is working for ${symbol}!`);
      } else {
        console.log(`\n⚠️  WARNING: No data returned for ${symbol}`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR testing ${symbol}:`, error.message);
    }
    
    // Small delay between requests
    await yahooFinanceService.delay(1000);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Test completed!");
  console.log("\nIf you see real data above, Yahoo Finance is working correctly.");
  console.log("You can now update your database with: node updateEarningsData.js");
}

// Run the test
testYahooFinance().catch(console.error);
