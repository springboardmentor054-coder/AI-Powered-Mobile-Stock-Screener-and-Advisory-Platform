const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { updateExistingStocks } = require('./populateDatabase');

/**
 * Update all existing stocks with latest data
 * This script updates fundamentals, shareholding, and earnings data for all stocks
 */
async function updateAll() {
  console.log('🔄 Starting comprehensive stock data update...\n');
  console.log('This will update:');
  console.log('  ✓ Fundamentals (PE, PEG, ratios, margins, etc.)');
  console.log('  ✓ Shareholding (insider, institutional holdings)');
  console.log('  ✓ Earnings & Analyst Data (estimates, ratings, targets)\n');
  
  try {
    const results = await updateExistingStocks();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successful} stocks`);
    console.log(`❌ Failed: ${failed} stocks`);
    console.log(`📈 Total: ${results.length} stocks`);
    
    if (failed > 0) {
      console.log('\n❌ Failed stocks:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.symbol}: ${r.error}`);
      });
    }
    
    console.log('\n✨ All stock data has been refreshed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateAll();
}

module.exports = { updateAll };
