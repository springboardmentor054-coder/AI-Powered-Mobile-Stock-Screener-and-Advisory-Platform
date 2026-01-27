const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { 
  populateStockData, 
  IT_SECTOR_STOCKS,
  FINANCIAL_STOCKS,
  HEALTHCARE_STOCKS,
  CONSUMER_STOCKS,
  ENERGY_STOCKS,
  INDUSTRIAL_STOCKS,
  COMMUNICATION_STOCKS,
  ALL_STOCKS
} = require('./populateDatabase');
const db = require('../config/database');

async function loadAllRemainingStocks() {
  try {
    console.log('🔍 Checking which stocks are already loaded...\n');
    
    // Get currently loaded stocks
    const result = await db.query('SELECT symbol FROM stocks');
    const loadedSymbols = new Set(result.rows.map(row => row.symbol));
    
    console.log(`Currently loaded: ${loadedSymbols.size} stocks`);
    console.log(`Total available: ${ALL_STOCKS.length} stocks\n`);
    
    // Find stocks that need to be loaded
    const stocksToLoad = ALL_STOCKS.filter(stock => !loadedSymbols.has(stock.symbol));
    
    if (stocksToLoad.length === 0) {
      console.log('✅ All stocks are already loaded!');
      process.exit(0);
    }
    
    console.log(`📋 Found ${stocksToLoad.length} stocks to load:\n`);
    
    // Group by sector for display
    const bySector = stocksToLoad.reduce((acc, stock) => {
      if (!acc[stock.sector]) acc[stock.sector] = [];
      acc[stock.sector].push(stock.symbol);
      return acc;
    }, {});
    
    Object.entries(bySector).forEach(([sector, symbols]) => {
      console.log(`  ${sector}: ${symbols.length} stocks (${symbols.join(', ')})`);
    });
    
    console.log(`\n🚀 Starting to load ${stocksToLoad.length} stocks...`);
    console.log(`⚡ Using Yahoo Finance - Fast & Unlimited!`);
    console.log(`⏱️  Estimated time: ~${Math.ceil(stocksToLoad.length * 3 / 60)} minutes (with 3s delays)\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Load each stock
    for (let i = 0; i < stocksToLoad.length; i++) {
      const stock = stocksToLoad[i];
      const progress = `[${i + 1}/${stocksToLoad.length}]`;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${progress} Loading ${stock.symbol} - ${stock.sector} - ${stock.category}`);
      console.log('='.repeat(60));
      
      try {
        await populateStockData(stock.symbol, stock.sector, stock.category);
        successCount++;
        console.log(`✅ Successfully loaded ${stock.symbol}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error loading ${stock.symbol}:`, error.message);
      }
      
      // Wait just 3 seconds between stocks (Yahoo Finance is free with no hard limits!)
      if (i < stocksToLoad.length - 1) {
        const remaining = stocksToLoad.length - i - 1;
        const eta = Math.ceil(remaining * 3 / 60);
        console.log(`⏳ Waiting 3s... (${remaining} stocks remaining, ETA: ~${eta} min)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOADING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully loaded: ${successCount} stocks`);
    console.log(`❌ Failed: ${errorCount} stocks`);
    
    // Show final count
    const finalResult = await db.query('SELECT COUNT(*) as total FROM stocks');
    console.log(`\n🎉 Total stocks in database: ${finalResult.rows[0].total}`);
    
    // Update all stocks with additional data
    if (successCount > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 Updating additional data for all stocks...');
      console.log('='.repeat(60));
      
      const { 
        updateStocksTable,
        updateFundamentalsTable,
        populateShareholdingTable
      } = require('./populateDatabase');
      
      try {
        console.log('\n1️⃣ Updating stocks table with company info...');
        await updateStocksTable();
        
        console.log('\n2️⃣ Updating fundamentals table...');
        await updateFundamentalsTable();
        
        console.log('\n3️⃣ Populating shareholding data...');
        await populateShareholdingTable();
        
        console.log('\n✅ All updates complete!');
      } catch (error) {
        console.error('⚠️  Some updates failed:', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

loadAllRemainingStocks();
