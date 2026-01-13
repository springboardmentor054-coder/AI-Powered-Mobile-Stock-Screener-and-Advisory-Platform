// Test what's available in yahoo-finance2
const yf = require('yahoo-finance2');

console.log("Checking yahoo-finance2 exports:");
console.log("Keys:", Object.keys(yf));
console.log("\nDefault export:", yf.default);
console.log("\nType of default:", typeof yf.default);

if (yf.default && typeof yf.default.quote === 'function') {
  console.log("\n✅ Can use: const yahooFinance = require('yahoo-finance2').default");
  
  // Test a simple call
  yf.default.quote('AAPL').then(result => {
    console.log("\n✅ Successfully fetched AAPL quote:");
    console.log("Price:", result.regularMarketPrice);
    console.log("Symbol:", result.symbol);
  }).catch(err => {
    console.error("\n❌ Error:", err.message);
  });
}
