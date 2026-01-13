const alphaVantageService = require("../services/alphaVantageService");
const yahooFinanceService = require("../services/yahooFinanceService");
const stockDataService = require("../services/stockDataService");

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
    
    // Insert quarterly financials with YoY growth
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
      
      await stockDataService.insertFinancialPerformance({
        symbol: overview.symbol,
        periodType: "Quarterly",
        period: current.fiscalDateEnding,
        revenue: current.revenue,
        ebitda: current.ebitda,
        revenueYoyGrowth: revenueYoyGrowth,
        ebitdaYoyGrowth: ebitdaYoyGrowth
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
  updateExistingStocks
};
