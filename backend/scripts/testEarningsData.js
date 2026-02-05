const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const yahooFinanceService = require('../services/yahooFinanceService');

async function testEarningsData() {
  try {
    console.log('Testing earnings data fetch for sample stocks...\n');
    
    const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    for (const symbol of testSymbols) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing ${symbol}`);
      console.log('='.repeat(60));
      
      const data = await yahooFinanceService.getComprehensiveEarningsAnalystData(symbol);
      
      console.log('\nFull Data Object:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\nKey Fields:');
      console.log(`  earnings_date: ${data.earningsDate}`);
      console.log(`  estimated_eps: ${data.estimatedEps}`);
      console.log(`  analyst_count: ${data.analystCount}`);
      console.log(`  consensus_rating: ${data.consensusRating}`);
      console.log(`  current_price: ${data.currentPrice}`);
      console.log(`  target_price_low: ${data.analystTargetPriceLow}`);
      console.log(`  target_price_high: ${data.analystTargetPriceHigh}`);
      
      await yahooFinanceService.delay(2000);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEarningsData();
