const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { populateStockData, IT_SECTOR_STOCKS } = require('./populateDatabase');
const db = require('../config/database');

async function loadRemainingITStocks() {
  try {
    console.log('🔍 Checking which IT stocks are already loaded...\n');
    
    // Get currently loaded stocks
    const result = await db.query('SELECT symbol FROM stocks');
    const loadedSymbols = new Set(result.rows.map(row => row.symbol));
    
    console.log(`Currently loaded stocks: ${Array.from(loadedSymbols).join(', ')}\n`);
    console.log(`Total IT stocks defined: ${IT_SECTOR_STOCKS.length}`);
    
    // Find stocks that need to be loaded
    const stocksToLoad = IT_SECTOR_STOCKS.filter(stock => !loadedSymbols.has(stock.symbol));
    
    console.log(`Stocks to load: ${stocksToLoad.length}\n`);
    
    if (stocksToLoad.length === 0) {
      console.log('✅ All IT stocks are already loaded!');
      process.exit(0);
    }
    
    console.log('📋 Remaining IT stocks to load:');
    stocksToLoad.forEach(stock => {
      console.log(`  - ${stock.symbol} (${stock.category})`);
    });
    
    console.log('\n🚀 Starting to load remaining IT stocks...\n');
    
    // Load each stock
    for (const stock of stocksToLoad) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Loading ${stock.symbol} - ${stock.category}`);
      console.log('='.repeat(50));
      
      try {
        await populateStockData(stock.symbol, stock.sector, stock.category);
        console.log(`✅ Successfully loaded ${stock.symbol}\n`);
        
        // Wait 13 seconds between stocks to respect Alpha Vantage rate limit
        if (stocksToLoad.indexOf(stock) < stocksToLoad.length - 1) {
          console.log('⏳ Waiting 13 seconds for rate limit...');
          await new Promise(resolve => setTimeout(resolve, 13000));
        }
      } catch (error) {
        console.error(`❌ Error loading ${stock.symbol}:`, error.message);
      }
    }
    
    console.log('\n✅ Finished loading remaining IT stocks!');
    
    // Show final count
    const finalResult = await db.query('SELECT COUNT(*) as total FROM stocks');
    console.log(`\nTotal stocks in database: ${finalResult.rows[0].total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

loadRemainingITStocks();
