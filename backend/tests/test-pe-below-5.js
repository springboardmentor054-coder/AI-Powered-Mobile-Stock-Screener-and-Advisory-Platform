/**
 * End-to-end test for "PE < 5" query
 * Tests: LLM Parser (NL → DSL) → DSL Compiler → SQL Runner
 */

const axios = require('axios');

async function testScreener() {
  console.log('🧪 Testing Stock Screener Engine\n');
  console.log('=================================');
  
  const queries = [
    "PE < 5",
    "Show stocks with PE below 5",
    "Find IT stocks with PE ratio less than 20",
    "Technology companies with PE < 15"
  ];
  
  for (const query of queries) {
    console.log(`\n📊 Query: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const response = await axios.post('http://localhost:5000/api/screener', {
        query: query
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Success: ${response.data.success}`);
      console.log(`✅ Results: ${response.data.data.length} stocks found`);
      
      if (response.data.data.length > 0) {
        console.log('\n📈 Sample Results:');
        response.data.data.slice(0, 3).forEach((stock, idx) => {
          console.log(`  ${idx + 1}. ${stock.symbol} - ${stock.name}`);
          console.log(`     Sector: ${stock.sector}`);
          console.log(`     PE: ${stock.pe_ratio}`);
          console.log(`     Market Cap: $${(stock.market_cap / 1e9).toFixed(2)}B`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n=================================');
  console.log('🎉 Test Complete!\n');
}

// Run test
testScreener().catch(console.error);
