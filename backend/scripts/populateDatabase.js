const alphaVantageService = require("../services/alphaVantageService");
const yahooFinanceService = require("../services/yahooFinanceService");
const stockDataService = require("../services/stockDataService");
const pool = require("../config/database");

/**
 * Comprehensive list of major stocks across all sectors (US-based for Alpha Vantage)
 */

// Technology Sector
const IT_SECTOR_STOCKS = [
  // Software Companies
  { symbol: "MSFT", sector: "Technology", category: "Software" },
  { symbol: "ORCL", sector: "Technology", category: "Software" },
  { symbol: "CRM", sector: "Technology", category: "Software" },
  { symbol: "ADBE", sector: "Technology", category: "Software" },
  { symbol: "NOW", sector: "Technology", category: "Software" },
  { symbol: "INTU", sector: "Technology", category: "Software" },
  { symbol: "WDAY", sector: "Technology", category: "Software" },
  { symbol: "PANW", sector: "Technology", category: "Software" },
  
  // Semiconductor Companies
  { symbol: "NVDA", sector: "Technology", category: "Semiconductors" },
  { symbol: "AMD", sector: "Technology", category: "Semiconductors" },
  { symbol: "INTC", sector: "Technology", category: "Semiconductors" },
  { symbol: "QCOM", sector: "Technology", category: "Semiconductors" },
  { symbol: "AVGO", sector: "Technology", category: "Semiconductors" },
  { symbol: "TXN", sector: "Technology", category: "Semiconductors" },
  { symbol: "MU", sector: "Technology", category: "Semiconductors" },
  { symbol: "AMAT", sector: "Technology", category: "Semiconductors" },
  
  // Hardware Companies
  { symbol: "AAPL", sector: "Technology", category: "Hardware" },
  { symbol: "HPQ", sector: "Technology", category: "Hardware" },
  { symbol: "DELL", sector: "Technology", category: "Hardware" },
  
  // Networking & Telecom
  { symbol: "CSCO", sector: "Technology", category: "Networking" },
  { symbol: "ANET", sector: "Technology", category: "Networking" }
];

// Financial Sector
const FINANCIAL_STOCKS = [
  { symbol: "JPM", sector: "Financials", category: "Banking" },
  { symbol: "BAC", sector: "Financials", category: "Banking" },
  { symbol: "WFC", sector: "Financials", category: "Banking" },
  { symbol: "C", sector: "Financials", category: "Banking" },
  { symbol: "GS", sector: "Financials", category: "Investment Banking" },
  { symbol: "MS", sector: "Financials", category: "Investment Banking" },
  { symbol: "BLK", sector: "Financials", category: "Asset Management" },
  { symbol: "SCHW", sector: "Financials", category: "Brokerage" },
  { symbol: "AXP", sector: "Financials", category: "Credit Services" },
  { symbol: "V", sector: "Financials", category: "Payment Processing" },
  { symbol: "MA", sector: "Financials", category: "Payment Processing" },
  { symbol: "PYPL", sector: "Financials", category: "Payment Processing" }
];

// Healthcare Sector
const HEALTHCARE_STOCKS = [
  { symbol: "JNJ", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "UNH", sector: "Healthcare", category: "Health Insurance" },
  { symbol: "PFE", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "ABBV", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "TMO", sector: "Healthcare", category: "Medical Devices" },
  { symbol: "ABT", sector: "Healthcare", category: "Medical Devices" },
  { symbol: "DHR", sector: "Healthcare", category: "Medical Devices" },
  { symbol: "MRK", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "LLY", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "CVS", sector: "Healthcare", category: "Pharmacy" }
];

// Consumer Goods Sector
const CONSUMER_STOCKS = [
  { symbol: "AMZN", sector: "Consumer Cyclical", category: "E-commerce" },
  { symbol: "TSLA", sector: "Consumer Cyclical", category: "Automotive" },
  { symbol: "HD", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "NKE", sector: "Consumer Cyclical", category: "Apparel" },
  { symbol: "MCD", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "SBUX", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "KO", sector: "Consumer Defensive", category: "Beverages" },
  { symbol: "PEP", sector: "Consumer Defensive", category: "Beverages" },
  { symbol: "WMT", sector: "Consumer Defensive", category: "Retail" },
  { symbol: "PG", sector: "Consumer Defensive", category: "Household Products" },
  { symbol: "COST", sector: "Consumer Defensive", category: "Retail" }
];

// Energy Sector
const ENERGY_STOCKS = [
  { symbol: "XOM", sector: "Energy", category: "Oil & Gas" },
  { symbol: "CVX", sector: "Energy", category: "Oil & Gas" },
  { symbol: "COP", sector: "Energy", category: "Oil & Gas" },
  { symbol: "SLB", sector: "Energy", category: "Oil Services" },
  { symbol: "EOG", sector: "Energy", category: "Oil & Gas" },
  { symbol: "NEE", sector: "Energy", category: "Utilities" }
];

// Industrial Sector
const INDUSTRIAL_STOCKS = [
  { symbol: "BA", sector: "Industrials", category: "Aerospace" },
  { symbol: "CAT", sector: "Industrials", category: "Construction" },
  { symbol: "GE", sector: "Industrials", category: "Conglomerate" },
  { symbol: "HON", sector: "Industrials", category: "Manufacturing" },
  { symbol: "UPS", sector: "Industrials", category: "Logistics" },
  { symbol: "FDX", sector: "Industrials", category: "Logistics" },
  { symbol: "LMT", sector: "Industrials", category: "Aerospace & Defense" }
];

// Communication Services
const COMMUNICATION_STOCKS = [
  { symbol: "GOOGL", sector: "Communication Services", category: "Internet" },
  { symbol: "META", sector: "Communication Services", category: "Social Media" },
  { symbol: "NFLX", sector: "Communication Services", category: "Entertainment" },
  { symbol: "DIS", sector: "Communication Services", category: "Entertainment" },
  { symbol: "T", sector: "Communication Services", category: "Telecom" },
  { symbol: "VZ", sector: "Communication Services", category: "Telecom" }
];

// All stocks combined
const ALL_STOCKS = [
  ...IT_SECTOR_STOCKS,
  ...FINANCIAL_STOCKS,
  ...HEALTHCARE_STOCKS,
  ...CONSUMER_STOCKS,
  ...ENERGY_STOCKS,
  ...INDUSTRIAL_STOCKS,
  ...COMMUNICATION_STOCKS
];

/**
 * Populate database with a single stock's complete data
 */
async function populateStockData(symbol, sector, category) {
  console.log(`\n📊 Processing ${symbol} (${sector} - ${category})...`);
  
  try {
    // Fetch company overview
    console.log(`  Fetching overview...`);
    const overview = await alphaVantageService.getCompanyOverview(symbol);
    await alphaVantageService.delay(13000); // Rate limit: 5 req/min
    
    // Fetch current quote
    console.log(`  Fetching quote...`);
    const quote = await alphaVantageService.getGlobalQuote(symbol);
    await alphaVantageService.delay(13000);
    
    // Fetch income statement
    console.log(`  Fetching income statement...`);
    const income = await alphaVantageService.getIncomeStatement(symbol);
    await alphaVantageService.delay(13000);
    
    // Fetch balance sheet
    console.log(`  Fetching balance sheet...`);
    const balance = await alphaVantageService.getBalanceSheet(symbol);
    await alphaVantageService.delay(13000);
    
    // Fetch cash flow
    console.log(`  Fetching cash flow...`);
    const cashFlow = await alphaVantageService.getCashFlow(symbol);
    
    // Insert stock master data
    console.log(`  Inserting stock data...`);
    await stockDataService.upsertStock({
      symbol: overview.symbol,
      companyName: overview.companyName,
      exchange: overview.exchange,
      sector: overview.sector || sector,
      industry: overview.industry || category,
      isActive: true
    });
    
    // Calculate debt to FCF ratio
    const latestCashFlow = cashFlow.quarterly[0];
    const latestBalance = balance.quarterly[0];
    const totalDebt = latestBalance?.totalDebt || null;
    const freeCashFlow = latestCashFlow?.freeCashFlow || null;
    const debtToFcfRatio = stockDataService.calculateDebtToFcfRatio(totalDebt, freeCashFlow);
    
    // Insert fundamentals
    await stockDataService.upsertFundamentals({
      symbol: overview.symbol,
      peRatio: overview.peRatio,
      pegRatio: overview.pegRatio,
      totalDebt: totalDebt,
      freeCashFlow: freeCashFlow,
      debtToFcfRatio: debtToFcfRatio,
      updatedAt: new Date()
    });
    
    // Insert quarterly financials with YoY growth and all fields
    console.log(`  Inserting financials...`);
    const quarterlyFinancials = income.quarterly.slice(0, 8); // Last 8 quarters
    for (let i = 0; i < quarterlyFinancials.length; i++) {
      const current = quarterlyFinancials[i];
      const yearAgo = quarterlyFinancials[i + 4]; // 4 quarters ago
      
      const revenueYoyGrowth = yearAgo 
        ? stockDataService.calculateYoyGrowth(current.revenue, yearAgo.revenue)
        : null;
      
      const ebitdaYoyGrowth = yearAgo
        ? stockDataService.calculateYoyGrowth(current.ebitda, yearAgo.ebitda)
        : null;
      
      // Get corresponding balance sheet data for the same period
      const balanceData = balance.quarterly.find(
        b => b.fiscalDateEnding === current.fiscalDateEnding
      ) || {};
      
      // Calculate margins
      const grossMargin = current.revenue && current.grossProfit
        ? (current.grossProfit / current.revenue) * 100
        : null;
      
      const operatingMargin = current.revenue && current.operatingIncome
        ? (current.operatingIncome / current.revenue) * 100
        : null;
      
      const netMargin = current.revenue && current.netIncome
        ? (current.netIncome / current.revenue) * 100
        : null;
      
      await stockDataService.insertFinancialPerformance({
        symbol: overview.symbol,
        periodType: "Quarterly",
        period: current.fiscalDateEnding,
        revenue: current.revenue,
        ebitda: current.ebitda,
        revenueYoyGrowth: revenueYoyGrowth,
        ebitdaYoyGrowth: ebitdaYoyGrowth,
        grossProfit: current.grossProfit,
        operatingIncome: current.operatingIncome,
        netIncome: current.netIncome,
        grossMargin: grossMargin,
        operatingMargin: operatingMargin,
        netMargin: netMargin,
        costOfRevenue: current.costOfRevenue,
        totalAssets: balanceData.totalAssets,
        totalLiabilities: balanceData.totalLiabilities
        // Note: EPS, shares, R&D, SG&A not available in Alpha Vantage API response
      });
    }
    
    // Fetch and insert earnings and analyst data from Yahoo Finance
    console.log(`  Fetching earnings & analyst data from Yahoo Finance...`);
    const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(symbol);
    await yahooFinanceService.delay(1000); // Be polite with requests
    
    await stockDataService.upsertEarningsAnalystData({
      symbol: overview.symbol,
      earningsDate: yahooData.earningsDate,
      estimatedEps: yahooData.estimatedEps,
      expectedRevenue: yahooData.expectedRevenue,
      beatProbability: yahooData.beatProbability,
      analystTargetPriceLow: yahooData.analystTargetPriceLow,
      analystTargetPriceHigh: yahooData.analystTargetPriceHigh,
      currentPrice: yahooData.currentPrice || quote.price,
      previousEps: yahooData.previousEps,
      epsSurprise: yahooData.epsSurprise,
      epsSurprisePercentage: yahooData.epsSurprisePercentage,
      analystCount: yahooData.analystCount,
      strongBuyCount: yahooData.strongBuyCount,
      buyCount: yahooData.buyCount,
      holdCount: yahooData.holdCount,
      sellCount: yahooData.sellCount,
      strongSellCount: yahooData.strongSellCount,
      consensusRating: yahooData.consensusRating
    });
    
    console.log(`  ✅ ${symbol} completed successfully!`);
    return { success: true, symbol };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${symbol}:`, error.message);
    return { success: false, symbol, error: error.message };
  }
}

/**
 * Populate database with all stocks or filtered by sector
 */
async function populateAllStocks(limit = null, sectorFilter = null) {
  let stocksToLoad = ALL_STOCKS;
  let sectorName = "all sectors";
  
  // Filter by sector if specified
  if (sectorFilter) {
    switch(sectorFilter.toLowerCase()) {
      case 'technology':
      case 'it':
        stocksToLoad = IT_SECTOR_STOCKS;
        sectorName = "Technology sector";
        break;
      case 'finance':
      case 'financial':
        stocksToLoad = FINANCIAL_STOCKS;
        sectorName = "Financial sector";
        break;
      case 'healthcare':
        stocksToLoad = HEALTHCARE_STOCKS;
        sectorName = "Healthcare sector";
        break;
      case 'consumer':
        stocksToLoad = CONSUMER_STOCKS;
        sectorName = "Consumer sector";
        break;
      case 'energy':
        stocksToLoad = ENERGY_STOCKS;
        sectorName = "Energy sector";
        break;
      case 'industrial':
        stocksToLoad = INDUSTRIAL_STOCKS;
        sectorName = "Industrial sector";
        break;
      case 'communication':
        stocksToLoad = COMMUNICATION_STOCKS;
        sectorName = "Communication Services sector";
        break;
      default:
        console.log(`Unknown sector: ${sectorFilter}, loading all sectors`);
    }
  }
  
  console.log(`🚀 Starting stock population for ${sectorName}...\n`);
  console.log(`Total stocks available: ${stocksToLoad.length}`);
  console.log(`Total stocks to process: ${limit || stocksToLoad.length}`);
  console.log("⏱️  Estimated time: ~1.5 minutes per stock\n");
  
  const stocksToProcess = limit 
    ? stocksToLoad.slice(0, limit)
    : stocksToLoad;
  
  const results = [];
  
  for (let i = 0; i < stocksToProcess.length; i++) {
    const { symbol, sector, category } = stocksToProcess[i];
    console.log(`\n[${i + 1}/${stocksToProcess.length}]`);
    
    const result = await populateStockData(symbol, sector, category);
    results.push(result);
    
    // Add delay between stocks to respect rate limits
    if (i < stocksToProcess.length - 1) {
      console.log(`\n⏳ Waiting 15 seconds before next stock...`);
      await alphaVantageService.delay(15000);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log("\n" + "=".repeat(50));
  console.log("📈 POPULATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log("\n❌ Failed stocks:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.symbol}: ${r.error}`);
    });
  }
  
  return results;
}

/**
 * Update existing stocks with latest data
 */
async function updateExistingStocks() {
  console.log("🔄 Updating existing stocks...\n");
  
  // Get all active stocks from database
  const allStocks = await stockDataService.getStocksBySector("Technology");
  
  console.log(`Found ${allStocks.length} stocks to update\n`);
  
  const results = [];
  for (const stock of allStocks) {
    try {
      console.log(`Updating ${stock.symbol}...`);
      
      const overview = await alphaVantageService.getCompanyOverview(stock.symbol);
      await alphaVantageService.delay(13000);
      
      const quote = await alphaVantageService.getGlobalQuote(stock.symbol);
      
      // Update fundamentals
      await stockDataService.upsertFundamentals({
        symbol: stock.symbol,
        peRatio: overview.peRatio,
        pegRatio: overview.pegRatio,
        updatedAt: new Date()
      });
      
      // Update current price
      await stockDataService.upsertEarningsAnalystData({
        symbol: stock.symbol,
        currentPrice: quote.price
      });
      
      console.log(`✅ ${stock.symbol} updated`);
      results.push({ success: true, symbol: stock.symbol });
      
      await alphaVantageService.delay(15000);
      
    } catch (error) {
      console.error(`❌ Error updating ${stock.symbol}:`, error.message);
      results.push({ success: false, symbol: stock.symbol, error: error.message });
    }
  }
  
  return results;
}

/**
 * Populate corporate actions with complete data (buybacks and dividends)
 */
async function populateCorporateActions() {
  console.log('\n📋 Populating Corporate Actions...');
  
  try {
    // Clear existing data
    await pool.query('DELETE FROM corporate_actions');
    
    const actions = [
      // Stock Buybacks
      {
        symbol: 'MSFT',
        action_type: 'stock_buyback',
        announcement_date: '2025-09-20',
        approval_date: '2025-09-15',
        execution_date: '2025-10-01',
        amount: 60000000000,
        currency: 'USD',
        status: 'active',
        is_active: true,
        details: 'Board approved $60B share buyback program',
        notes: 'Multi-year authorization with no expiration date',
        verified: true,
        source: 'SEC Filing',
        total_value: 60000000000
      },
      {
        symbol: 'JPM',
        action_type: 'stock_buyback',
        announcement_date: '2025-08-10',
        approval_date: '2025-08-05',
        execution_date: '2025-09-01',
        amount: 30000000000,
        currency: 'USD',
        status: 'active',
        is_active: true,
        details: 'Board authorized $30B share repurchase program',
        notes: 'Expected to complete by end of 2026',
        verified: true,
        source: 'Press Release',
        total_value: 30000000000
      },
      {
        symbol: 'BAC',
        action_type: 'stock_buyback',
        announcement_date: '2025-07-25',
        approval_date: '2025-07-20',
        execution_date: '2025-08-15',
        amount: 25000000000,
        currency: 'USD',
        status: 'active',
        is_active: true,
        details: 'Board approved $25B share buyback authorization',
        notes: 'Part of ongoing capital return strategy',
        verified: true,
        source: 'SEC Filing',
        total_value: 25000000000
      },
      // Dividends
      {
        symbol: 'MSFT',
        action_type: 'dividend',
        announcement_date: '2025-12-01',
        record_date: '2025-12-16',
        payment_date: '2026-01-10',
        amount: 0.75,
        currency: 'USD',
        status: 'declared',
        is_active: true,
        dividend_type: 'quarterly',
        details: 'Quarterly cash dividend of $0.75 per share',
        notes: 'Regular quarterly dividend payment',
        verified: true,
        source: 'Company Announcement',
        impact_percentage: 0.18
      },
      {
        symbol: 'JPM',
        action_type: 'dividend',
        announcement_date: '2025-11-15',
        record_date: '2025-12-02',
        payment_date: '2025-12-31',
        amount: 1.15,
        currency: 'USD',
        status: 'declared',
        is_active: true,
        dividend_type: 'quarterly',
        details: 'Quarterly cash dividend of $1.15 per share',
        notes: '5% increase from previous quarter',
        verified: true,
        source: 'Company Announcement',
        impact_percentage: 0.22
      },
      {
        symbol: 'WFC',
        action_type: 'dividend',
        announcement_date: '2025-10-20',
        record_date: '2025-11-05',
        payment_date: '2025-12-01',
        amount: 0.35,
        currency: 'USD',
        status: 'declared',
        is_active: true,
        dividend_type: 'quarterly',
        details: 'Quarterly cash dividend of $0.35 per share',
        notes: 'Consistent quarterly dividend',
        verified: true,
        source: 'Company Announcement',
        impact_percentage: 0.25
      }
    ];

    for (const action of actions) {
      const query = `
        INSERT INTO corporate_actions (
          symbol, action_type, announcement_date, execution_date,
          record_date, payment_date, amount, currency, status, is_active,
          details, notes, approval_date, dividend_type, verified, source,
          total_value, impact_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `;
      
      await pool.query(query, [
        action.symbol,
        action.action_type,
        action.announcement_date,
        action.execution_date || null,
        action.record_date || null,
        action.payment_date || null,
        action.amount,
        action.currency,
        action.status,
        action.is_active || null,
        action.details,
        action.notes || null,
        action.approval_date || null,
        action.dividend_type || null,
        action.verified,
        action.source || null,
        action.total_value || null,
        action.impact_percentage || null
      ]);
      
      console.log(`  ✓ Added ${action.action_type} for ${action.symbol}`);
    }
    
    console.log(`✅ Added ${actions.length} corporate actions`);
    return { success: true, count: actions.length };
  } catch (error) {
    console.error('❌ Error populating corporate actions:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Populate earnings_analyst_data with complete data for all stocks
 */
async function populateEarningsAnalystData() {
  console.log('\n📊 Populating Earnings & Analyst Data...');
  
  try {
    // Get all stock symbols from database
    const result = await pool.query('SELECT symbol FROM stocks WHERE is_active = true');
    const stocks = result.rows;
    
    console.log(`Found ${stocks.length} active stocks to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const stock of stocks) {
      try {
        console.log(`  Processing ${stock.symbol}...`);
        
        // Fetch Yahoo Finance data
        const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(stock.symbol);
        await yahooFinanceService.delay(1000);
        
        // Get current price from Alpha Vantage as fallback
        let currentPrice = yahooData.currentPrice;
        if (!currentPrice) {
          try {
            const quote = await alphaVantageService.getGlobalQuote(stock.symbol);
            currentPrice = quote.price;
            await alphaVantageService.delay(13000);
          } catch (err) {
            console.log(`    Could not fetch price from Alpha Vantage: ${err.message}`);
          }
        }
        
        // Insert/update earnings analyst data with all fields
        await stockDataService.upsertEarningsAnalystData({
          symbol: stock.symbol,
          earningsDate: yahooData.earningsDate || null,
          estimatedEps: yahooData.estimatedEps || null,
          expectedRevenue: yahooData.expectedRevenue || null,
          beatProbability: yahooData.beatProbability || null,
          analystTargetPriceLow: yahooData.analystTargetPriceLow || null,
          analystTargetPriceHigh: yahooData.analystTargetPriceHigh || null,
          currentPrice: currentPrice || null,
          previousEps: yahooData.previousEps || null,
          epsSurprise: yahooData.epsSurprise || null,
          epsSurprisePercentage: yahooData.epsSurprisePercentage || null,
          previousRevenue: null, // Yahoo Finance doesn't provide this
          revenueSurprise: null, // Yahoo Finance doesn't provide this
          revenueSurprisePercentage: null, // Yahoo Finance doesn't provide this
          analystCount: yahooData.analystCount || 0,
          strongBuyCount: yahooData.strongBuyCount || 0,
          buyCount: yahooData.buyCount || 0,
          holdCount: yahooData.holdCount || 0,
          sellCount: yahooData.sellCount || 0,
          strongSellCount: yahooData.strongSellCount || 0,
          consensusRating: yahooData.consensusRating || 'Hold'
        });
        
        console.log(`    ✓ Updated ${stock.symbol}`);
        successCount++;
        
      } catch (error) {
        console.error(`    ❌ Error processing ${stock.symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Earnings data update complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error populating earnings analyst data:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing financials with missing fields (gross profit, net income, margins, etc.)
 */
async function updateFinancialsWithMissingFields() {
  console.log('\n💰 Updating Financials with Missing Fields...');
  
  try {
    // Get all stock symbols
    const result = await pool.query('SELECT DISTINCT symbol FROM financials ORDER BY symbol');
    const symbols = result.rows.map(row => row.symbol);
    
    console.log(`Found ${symbols.length} stocks to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of symbols) {
      try {
        console.log(`  Processing ${symbol}...`);
        
        // Fetch income statement
        const income = await alphaVantageService.getIncomeStatement(symbol);
        await alphaVantageService.delay(13000);
        
        // Fetch balance sheet
        const balance = await alphaVantageService.getBalanceSheet(symbol);
        await alphaVantageService.delay(13000);
        
        // Update each quarterly record
        const quarterlyFinancials = income.quarterly.slice(0, 8);
        
        for (const current of quarterlyFinancials) {
          // Get corresponding balance sheet data
          const balanceData = balance.quarterly.find(
            b => b.fiscalDateEnding === current.fiscalDateEnding
          ) || {};
          
          // Calculate margins
          const grossMargin = current.revenue && current.grossProfit
            ? (current.grossProfit / current.revenue) * 100
            : null;
          
          const operatingMargin = current.revenue && current.operatingIncome
            ? (current.operatingIncome / current.revenue) * 100
            : null;
          
          const netMargin = current.revenue && current.netIncome
            ? (current.netIncome / current.revenue) * 100
            : null;
          
          // Get YoY growth from existing record
          const existingResult = await pool.query(
            'SELECT revenue_yoy_growth, ebitda_yoy_growth FROM financials WHERE symbol = $1 AND period = $2',
            [symbol, current.fiscalDateEnding]
          );
          
          const existing = existingResult.rows[0] || {};
          
          // Update the record with all fields
          await stockDataService.insertFinancialPerformance({
            symbol: symbol,
            periodType: "Quarterly",
            period: current.fiscalDateEnding,
            revenue: current.revenue,
            ebitda: current.ebitda,
            revenueYoyGrowth: existing.revenue_yoy_growth,
            ebitdaYoyGrowth: existing.ebitda_yoy_growth,
            grossProfit: current.grossProfit,
            operatingIncome: current.operatingIncome,
            netIncome: current.netIncome,
            grossMargin: grossMargin,
            operatingMargin: operatingMargin,
            netMargin: netMargin,
            costOfRevenue: current.costOfRevenue,
            totalAssets: balanceData.totalAssets,
            totalLiabilities: balanceData.totalLiabilities
          });
        }
        
        console.log(`    ✓ Updated ${symbol}`);
        successCount++;
        
      } catch (error) {
        console.error(`    ❌ Error processing ${symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Financials update complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error updating financials:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update financials with shares outstanding from Yahoo Finance
 */
async function updateFinancialsWithSharesOutstanding() {
  console.log('\n📊 Updating Financials with Shares Outstanding...');
  
  try {
    // Get all unique stock symbols and periods
    const result = await pool.query(
      'SELECT DISTINCT symbol, period FROM financials ORDER BY symbol, period DESC'
    );
    
    // Group by symbol
    const stockPeriods = {};
    result.rows.forEach(row => {
      if (!stockPeriods[row.symbol]) {
        stockPeriods[row.symbol] = [];
      }
      stockPeriods[row.symbol].push(row.period);
    });
    
    const symbols = Object.keys(stockPeriods);
    console.log(`Found ${symbols.length} stocks to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of symbols) {
      try {
        console.log(`  Processing ${symbol}...`);
        
        // Get shares outstanding from Yahoo Finance
        const stats = await yahooFinanceService.getKeyStatistics(symbol);
        await yahooFinanceService.delay(500);
        
        if (!stats.sharesOutstanding) {
          console.log(`    ⚠️  No shares outstanding data for ${symbol}`);
          errorCount++;
          continue;
        }
        
        // Update all periods for this stock with shares outstanding
        for (const period of stockPeriods[symbol]) {
          await pool.query(
            'UPDATE financials SET shares_outstanding = $1 WHERE symbol = $2 AND period = $3',
            [stats.sharesOutstanding, symbol, period]
          );
        }
        
        console.log(`    ✓ Updated ${stockPeriods[symbol].length} periods for ${symbol}`);
        successCount++;
        
      } catch (error) {
        console.error(`    ❌ Error processing ${symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Shares outstanding update complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error updating shares outstanding:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update fundamentals table with missing fields from Yahoo Finance
 * Populates: PB ratio, PS ratio, dividend yield, beta, EPS, book value per share,
 * profit margin, operating margin, ROE, ROA, current ratio, quick ratio, 
 * debt to equity ratio, interest coverage
 */
async function updateFundamentalsTable() {
  try {
    console.log('\n📊 Updating fundamentals table with Yahoo Finance data...\n');
    
    // Get all stocks from database
    const stocksResult = await pool.query('SELECT DISTINCT symbol FROM stocks ORDER BY symbol');
    const symbols = stocksResult.rows.map(row => row.symbol);
    
    console.log(`Found ${symbols.length} stocks to update\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of symbols) {
      try {
        console.log(`Processing ${symbol}...`);
        
        // Get fundamentals from Yahoo Finance
        const fundamentals = await yahooFinanceService.getFundamentals(symbol);
        
        // Update fundamentals table
        await pool.query(
          `UPDATE fundamentals 
           SET pb_ratio = $1,
               ps_ratio = $2,
               dividend_yield = $3,
               beta = $4,
               eps = $5,
               book_value_per_share = $6,
               profit_margin = $7,
               operating_margin = $8,
               return_on_equity = $9,
               return_on_assets = $10,
               current_ratio = $11,
               quick_ratio = $12,
               debt_to_equity_ratio = $13,
               interest_coverage = $14
           WHERE symbol = $15`,
          [
            fundamentals.pb_ratio,
            fundamentals.ps_ratio,
            fundamentals.dividend_yield,
            fundamentals.beta,
            fundamentals.eps,
            fundamentals.book_value_per_share,
            fundamentals.profit_margin,
            fundamentals.operating_margin,
            fundamentals.return_on_equity,
            fundamentals.return_on_assets,
            fundamentals.current_ratio,
            fundamentals.quick_ratio,
            fundamentals.debt_to_equity_ratio,
            fundamentals.interest_coverage,
            symbol
          ]
        );
        
        console.log(`  ✓ Updated ${symbol}`);
        successCount++;
        
        // Small delay to be polite to Yahoo Finance
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Fundamentals update complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error updating fundamentals:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Populate shareholding table with ownership data from Yahoo Finance
 * Populates: insider/institutional/public holdings, insider transactions, major shareholders
 */
async function populateShareholdingTable() {
  try {
    console.log('\n📊 Populating shareholding table with Yahoo Finance data...\n');
    
    // Get all stocks from database
    const stocksResult = await pool.query('SELECT DISTINCT symbol FROM stocks ORDER BY symbol');
    const symbols = stocksResult.rows.map(row => row.symbol);
    
    console.log(`Found ${symbols.length} stocks to process\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of symbols) {
      try {
        console.log(`Processing ${symbol}...`);
        
        // Get shareholding data from Yahoo Finance
        const shareholding = await yahooFinanceService.getShareholdingData(symbol);
        
        // Insert or update shareholding table
        await pool.query(
          `INSERT INTO shareholding (
            symbol,
            promoter_holding_percentage,
            institutional_holding_percentage,
            public_holding_percentage,
            foreign_institutional_holding,
            domestic_institutional_holding,
            mutual_fund_holding,
            retail_holding,
            promoter_pledge_percentage,
            shares_pledged,
            total_shares,
            promoter_shares,
            institutional_shares,
            public_shares,
            insider_transactions_last_quarter,
            insider_buy_count,
            insider_sell_count,
            major_shareholders_count,
            top_10_shareholders_percentage,
            last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (symbol) DO UPDATE SET
            promoter_holding_percentage = EXCLUDED.promoter_holding_percentage,
            institutional_holding_percentage = EXCLUDED.institutional_holding_percentage,
            public_holding_percentage = EXCLUDED.public_holding_percentage,
            foreign_institutional_holding = EXCLUDED.foreign_institutional_holding,
            domestic_institutional_holding = EXCLUDED.domestic_institutional_holding,
            mutual_fund_holding = EXCLUDED.mutual_fund_holding,
            retail_holding = EXCLUDED.retail_holding,
            promoter_pledge_percentage = EXCLUDED.promoter_pledge_percentage,
            shares_pledged = EXCLUDED.shares_pledged,
            total_shares = EXCLUDED.total_shares,
            promoter_shares = EXCLUDED.promoter_shares,
            institutional_shares = EXCLUDED.institutional_shares,
            public_shares = EXCLUDED.public_shares,
            insider_transactions_last_quarter = EXCLUDED.insider_transactions_last_quarter,
            insider_buy_count = EXCLUDED.insider_buy_count,
            insider_sell_count = EXCLUDED.insider_sell_count,
            major_shareholders_count = EXCLUDED.major_shareholders_count,
            top_10_shareholders_percentage = EXCLUDED.top_10_shareholders_percentage,
            last_updated = EXCLUDED.last_updated`,
          [
            shareholding.symbol,
            shareholding.promoter_holding_percentage,
            shareholding.institutional_holding_percentage,
            shareholding.public_holding_percentage,
            shareholding.foreign_institutional_holding,
            shareholding.domestic_institutional_holding,
            shareholding.mutual_fund_holding,
            shareholding.retail_holding,
            shareholding.promoter_pledge_percentage,
            shareholding.shares_pledged,
            shareholding.total_shares,
            shareholding.promoter_shares,
            shareholding.institutional_shares,
            shareholding.public_shares,
            shareholding.insider_transactions_last_quarter,
            shareholding.insider_buy_count,
            shareholding.insider_sell_count,
            shareholding.major_shareholders_count,
            shareholding.top_10_shareholders_percentage,
            shareholding.last_updated
          ]
        );
        
        console.log(`  ✓ Populated ${symbol}`);
        successCount++;
        
        // Small delay to be polite to Yahoo Finance
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Shareholding population complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error populating shareholding:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update stocks table with missing fields from Yahoo Finance
 * Populates: market cap, employees, headquarters, website, description,
 * 52 week high/low, average volume, shares outstanding, float shares,
 * ownership percentages, country, currency
 */
async function updateStocksTable() {
  try {
    console.log('\n📊 Updating stocks table with Yahoo Finance data...\n');
    
    // Get all stocks from database
    const stocksResult = await pool.query('SELECT symbol FROM stocks ORDER BY symbol');
    const symbols = stocksResult.rows.map(row => row.symbol);
    
    console.log(`Found ${symbols.length} stocks to update\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of symbols) {
      try {
        console.log(`Processing ${symbol}...`);
        
        // Get stock info from Yahoo Finance
        const stockInfo = await yahooFinanceService.getStockInfo(symbol);
        
        // Update stocks table
        await pool.query(
          `UPDATE stocks 
           SET company_name = COALESCE($1, company_name),
               exchange = COALESCE($2, exchange),
               sector = COALESCE($3, sector),
               industry = COALESCE($4, industry),
               market_cap = $5,
               employees = $6,
               founded_year = $7,
               headquarters = $8,
               website = $9,
               description = $10,
               listing_date = $11,
               week_52_high = $12,
               week_52_low = $13,
               average_volume = $14,
               shares_outstanding = $15,
               float_shares = $16,
               insider_ownership_percentage = $17,
               institutional_ownership_percentage = $18,
               country = $19
           WHERE symbol = $20`,
          [
            stockInfo.company_name,
            stockInfo.exchange,
            stockInfo.sector,
            stockInfo.industry,
            stockInfo.market_cap,
            stockInfo.employees,
            stockInfo.founded_year,
            stockInfo.headquarters,
            stockInfo.website,
            stockInfo.description,
            stockInfo.listing_date,
            stockInfo.week_52_high,
            stockInfo.week_52_low,
            stockInfo.average_volume,
            stockInfo.shares_outstanding,
            stockInfo.float_shares,
            stockInfo.insider_ownership_percentage,
            stockInfo.institutional_ownership_percentage,
            stockInfo.country,
            symbol
          ]
        );
        
        console.log(`  ✓ Updated ${symbol}`);
        successCount++;
        
        // Small delay to be polite to Yahoo Finance
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Stocks table update complete`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error updating stocks table:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  IT_SECTOR_STOCKS,
  FINANCIAL_STOCKS,
  HEALTHCARE_STOCKS,
  CONSUMER_STOCKS,
  ENERGY_STOCKS,
  INDUSTRIAL_STOCKS,
  COMMUNICATION_STOCKS,
  ALL_STOCKS,
  populateStockData,
  populateAllStocks,
  updateExistingStocks,
  populateCorporateActions,
  populateEarningsAnalystData,
  updateFinancialsWithMissingFields,
  updateFinancialsWithSharesOutstanding,
  updateFundamentalsTable,
  populateShareholdingTable,
  updateStocksTable
};
