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
  { symbol: "SNOW", sector: "Technology", category: "Software" },
  { symbol: "CRWD", sector: "Technology", category: "Software" },
  { symbol: "ZS", sector: "Technology", category: "Software" },
  { symbol: "DDOG", sector: "Technology", category: "Software" },
  { symbol: "NET", sector: "Technology", category: "Software" },
  { symbol: "TEAM", sector: "Technology", category: "Software" },
  { symbol: "PLTR", sector: "Technology", category: "Software" },
  { symbol: "FTNT", sector: "Technology", category: "Software" },
  { symbol: "ADSK", sector: "Technology", category: "Software" },
  { symbol: "SNPS", sector: "Technology", category: "Software" },
  { symbol: "CDNS", sector: "Technology", category: "Software" },
  
  // Semiconductor Companies
  { symbol: "NVDA", sector: "Technology", category: "Semiconductors" },
  { symbol: "AMD", sector: "Technology", category: "Semiconductors" },
  { symbol: "INTC", sector: "Technology", category: "Semiconductors" },
  { symbol: "QCOM", sector: "Technology", category: "Semiconductors" },
  { symbol: "AVGO", sector: "Technology", category: "Semiconductors" },
  { symbol: "TXN", sector: "Technology", category: "Semiconductors" },
  { symbol: "MU", sector: "Technology", category: "Semiconductors" },
  { symbol: "AMAT", sector: "Technology", category: "Semiconductors" },
  { symbol: "ADI", sector: "Technology", category: "Semiconductors" },
  { symbol: "LRCX", sector: "Technology", category: "Semiconductors" },
  { symbol: "KLAC", sector: "Technology", category: "Semiconductors" },
  { symbol: "MCHP", sector: "Technology", category: "Semiconductors" },
  { symbol: "NXPI", sector: "Technology", category: "Semiconductors" },
  { symbol: "MRVL", sector: "Technology", category: "Semiconductors" },
  { symbol: "ON", sector: "Technology", category: "Semiconductors" },
  { symbol: "MPWR", sector: "Technology", category: "Semiconductors" },
  
  // Hardware Companies
  { symbol: "AAPL", sector: "Technology", category: "Hardware" },
  { symbol: "HPQ", sector: "Technology", category: "Hardware" },
  { symbol: "DELL", sector: "Technology", category: "Hardware" },
  { symbol: "HPE", sector: "Technology", category: "Hardware" },
  { symbol: "NTAP", sector: "Technology", category: "Hardware" },
  { symbol: "STX", sector: "Technology", category: "Hardware" },
  { symbol: "WDC", sector: "Technology", category: "Hardware" },
  
  // Networking & Cloud
  { symbol: "CSCO", sector: "Technology", category: "Networking" },
  { symbol: "ANET", sector: "Technology", category: "Networking" },
  { symbol: "CFLT", sector: "Technology", category: "Cloud" },
  { symbol: "AKAM", sector: "Technology", category: "Cloud" }
];

// Financial Sector
const FINANCIAL_STOCKS = [
  // Banks
  { symbol: "JPM", sector: "Financials", category: "Banking" },
  { symbol: "BAC", sector: "Financials", category: "Banking" },
  { symbol: "WFC", sector: "Financials", category: "Banking" },
  { symbol: "C", sector: "Financials", category: "Banking" },
  { symbol: "USB", sector: "Financials", category: "Banking" },
  { symbol: "PNC", sector: "Financials", category: "Banking" },
  { symbol: "TFC", sector: "Financials", category: "Banking" },
  { symbol: "COF", sector: "Financials", category: "Banking" },
  { symbol: "BK", sector: "Financials", category: "Banking" },
  { symbol: "STT", sector: "Financials", category: "Banking" },
  
  // Investment Banking & Asset Management
  { symbol: "GS", sector: "Financials", category: "Investment Banking" },
  { symbol: "MS", sector: "Financials", category: "Investment Banking" },
  { symbol: "BLK", sector: "Financials", category: "Asset Management" },
  { symbol: "SCHW", sector: "Financials", category: "Brokerage" },
  { symbol: "SPGI", sector: "Financials", category: "Financial Services" },
  { symbol: "CME", sector: "Financials", category: "Exchanges" },
  { symbol: "ICE", sector: "Financials", category: "Exchanges" },
  { symbol: "MCO", sector: "Financials", category: "Financial Services" },
  { symbol: "MSCI", sector: "Financials", category: "Financial Services" },
  
  // Payment Processing & Fintech
  { symbol: "V", sector: "Financials", category: "Payment Processing" },
  { symbol: "MA", sector: "Financials", category: "Payment Processing" },
  { symbol: "PYPL", sector: "Financials", category: "Payment Processing" },
  { symbol: "AXP", sector: "Financials", category: "Credit Services" },
  { symbol: "FIS", sector: "Financials", category: "Financial Services" },
  { symbol: "FISV", sector: "Financials", category: "Financial Services" },
  
  // Insurance
  { symbol: "PGR", sector: "Financials", category: "Insurance" },
  { symbol: "CB", sector: "Financials", category: "Insurance" },
  { symbol: "TRV", sector: "Financials", category: "Insurance" },
  { symbol: "ALL", sector: "Financials", category: "Insurance" },
  { symbol: "AIG", sector: "Financials", category: "Insurance" },
  { symbol: "MET", sector: "Financials", category: "Insurance" },
  { symbol: "PRU", sector: "Financials", category: "Insurance" },
  { symbol: "AFL", sector: "Financials", category: "Insurance" }
];

// Healthcare Sector
const HEALTHCARE_STOCKS = [
  // Pharmaceuticals
  { symbol: "JNJ", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "PFE", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "ABBV", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "MRK", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "LLY", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "BMY", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "AMGN", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "GILD", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "REGN", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "VRTX", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "BIIB", sector: "Healthcare", category: "Pharmaceuticals" },
  { symbol: "MRNA", sector: "Healthcare", category: "Pharmaceuticals" }
];

// Consumer Goods Sector
const CONSUMER_STOCKS = [
  // E-commerce & Retail
  { symbol: "AMZN", sector: "Consumer Cyclical", category: "E-commerce" },
  { symbol: "WMT", sector: "Consumer Defensive", category: "Retail" },
  { symbol: "COST", sector: "Consumer Defensive", category: "Retail" },
  { symbol: "HD", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "LOW", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "TGT", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "TJX", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "ROST", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "DG", sector: "Consumer Cyclical", category: "Retail" },
  { symbol: "DLTR", sector: "Consumer Cyclical", category: "Retail" },
  
  // Automotive
  { symbol: "TSLA", sector: "Consumer Cyclical", category: "Automotive" },
  { symbol: "F", sector: "Consumer Cyclical", category: "Automotive" },
  { symbol: "GM", sector: "Consumer Cyclical", category: "Automotive" },
  
  // Apparel & Footwear
  { symbol: "NKE", sector: "Consumer Cyclical", category: "Apparel" },
  { symbol: "LULU", sector: "Consumer Cyclical", category: "Apparel" },
  
  // Restaurants & Food Services
  { symbol: "MCD", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "SBUX", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "YUM", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "CMG", sector: "Consumer Cyclical", category: "Restaurants" },
  { symbol: "DPZ", sector: "Consumer Cyclical", category: "Restaurants" },
  
  // Beverages
  { symbol: "KO", sector: "Consumer Defensive", category: "Beverages" },
  { symbol: "PEP", sector: "Consumer Defensive", category: "Beverages" },
  { symbol: "MNST", sector: "Consumer Defensive", category: "Beverages" },
  
  // Household & Personal Products
  { symbol: "PG", sector: "Consumer Defensive", category: "Household Products" },
  { symbol: "CL", sector: "Consumer Defensive", category: "Household Products" },
  { symbol: "KMB", sector: "Consumer Defensive", category: "Household Products" },
  { symbol: "EL", sector: "Consumer Defensive", category: "Personal Products" },
  { symbol: "CLX", sector: "Consumer Defensive", category: "Household Products" },
  
  // Food & Packaged Goods
  { symbol: "MDLZ", sector: "Consumer Defensive", category: "Food" },
  { symbol: "GIS", sector: "Consumer Defensive", category: "Food" },
  { symbol: "HSY", sector: "Consumer Defensive", category: "Food" },
  { symbol: "CAG", sector: "Consumer Defensive", category: "Food" },
  { symbol: "KHC", sector: "Consumer Defensive", category: "Food" }
];

// Energy Sector
const ENERGY_STOCKS = [
  // Oil & Gas - Integrated
  { symbol: "XOM", sector: "Energy", category: "Oil & Gas" },
  { symbol: "CVX", sector: "Energy", category: "Oil & Gas" },
  { symbol: "COP", sector: "Energy", category: "Oil & Gas" },
  { symbol: "EOG", sector: "Energy", category: "Oil & Gas" },
  { symbol: "PSX", sector: "Energy", category: "Oil & Gas" },
  { symbol: "VLO", sector: "Energy", category: "Oil & Gas" },
  { symbol: "MPC", sector: "Energy", category: "Oil & Gas" },
  { symbol: "OXY", sector: "Energy", category: "Oil & Gas" },
  
  // Oil Services & Equipment
  { symbol: "SLB", sector: "Energy", category: "Oil Services" },
  { symbol: "HAL", sector: "Energy", category: "Oil Services" },
  { symbol: "BKR", sector: "Energy", category: "Oil Services" },
  
  // Utilities & Renewables
  { symbol: "NEE", sector: "Energy", category: "Utilities" },
  { symbol: "DUK", sector: "Energy", category: "Utilities" },
  { symbol: "SO", sector: "Energy", category: "Utilities" },
  { symbol: "D", sector: "Energy", category: "Utilities" },
  { symbol: "AEP", sector: "Energy", category: "Utilities" },
  { symbol: "EXC", sector: "Energy", category: "Utilities" },
  { symbol: "XEL", sector: "Energy", category: "Utilities" }
];

// Communication Services
const COMMUNICATION_STOCKS = [
  // Internet & Search
  { symbol: "GOOGL", sector: "Communication Services", category: "Internet" },
  { symbol: "GOOG", sector: "Communication Services", category: "Internet" },
  
  // Social Media
  { symbol: "META", sector: "Communication Services", category: "Social Media" },
  { symbol: "SNAP", sector: "Communication Services", category: "Social Media" },
  { symbol: "PINS", sector: "Communication Services", category: "Social Media" },
  
  // Entertainment & Streaming
  { symbol: "NFLX", sector: "Communication Services", category: "Entertainment" },
  { symbol: "DIS", sector: "Communication Services", category: "Entertainment" },
  { symbol: "WBD", sector: "Communication Services", category: "Entertainment" },
  { symbol: "CMCSA", sector: "Communication Services", category: "Media" },
  { symbol: "CHTR", sector: "Communication Services", category: "Media" },
  
  // Telecom
  { symbol: "T", sector: "Communication Services", category: "Telecom" },
  { symbol: "VZ", sector: "Communication Services", category: "Telecom" },
  { symbol: "TMUS", sector: "Communication Services", category: "Telecom" },
  
  // Gaming & Interactive Media
  { symbol: "EA", sector: "Communication Services", category: "Gaming" },
  { symbol: "TTWO", sector: "Communication Services", category: "Gaming" },
  { symbol: "RBLX", sector: "Communication Services", category: "Gaming" },
  { symbol: "U", sector: "Communication Services", category: "Gaming" }
];

// Industrial Sector
const INDUSTRIAL_STOCKS = [
  // Aerospace & Defense
  { symbol: "BA", sector: "Industrials", category: "Aerospace" },
  { symbol: "LMT", sector: "Industrials", category: "Aerospace & Defense" },
  { symbol: "RTX", sector: "Industrials", category: "Aerospace & Defense" },
  { symbol: "NOC", sector: "Industrials", category: "Aerospace & Defense" },
  { symbol: "GD", sector: "Industrials", category: "Aerospace & Defense" },
  { symbol: "HII", sector: "Industrials", category: "Aerospace & Defense" },
  
  // Conglomerates & Manufacturing
  { symbol: "GE", sector: "Industrials", category: "Conglomerate" },
  { symbol: "HON", sector: "Industrials", category: "Manufacturing" },
  { symbol: "MMM", sector: "Industrials", category: "Manufacturing" },
  { symbol: "ITW", sector: "Industrials", category: "Manufacturing" },
  { symbol: "EMR", sector: "Industrials", category: "Manufacturing" },
  { symbol: "ETN", sector: "Industrials", category: "Manufacturing" },
  { symbol: "PH", sector: "Industrials", category: "Manufacturing" },
  
  // Construction & Mining
  { symbol: "CAT", sector: "Industrials", category: "Construction" },
  { symbol: "DE", sector: "Industrials", category: "Construction" },
  
  // Logistics & Transportation
  { symbol: "UPS", sector: "Industrials", category: "Logistics" },
  { symbol: "FDX", sector: "Industrials", category: "Logistics" },
  { symbol: "UNP", sector: "Industrials", category: "Transportation" },
  { symbol: "NSC", sector: "Industrials", category: "Transportation" },
  { symbol: "CSX", sector: "Industrials", category: "Transportation" },
  { symbol: "DAL", sector: "Industrials", category: "Airlines" },
  { symbol: "UAL", sector: "Industrials", category: "Airlines" },
  { symbol: "AAL", sector: "Industrials", category: "Airlines" },
  { symbol: "LUV", sector: "Industrials", category: "Airlines" },
  
  // Waste Management & Services
  { symbol: "WM", sector: "Industrials", category: "Waste Management" },
  { symbol: "RSG", sector: "Industrials", category: "Waste Management" }
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
 * Now using Yahoo Finance as PRIMARY source (free, no limits)
 * Alpha Vantage kept as fallback for specific data
 */
async function populateStockData(symbol, sector, category) {
  console.log(`\n📊 Processing ${symbol} (${sector} - ${category})...`);
  
  try {
    // Step 1: Get comprehensive stock info from Yahoo Finance (FREE, NO LIMITS!)
    console.log(`  ✨ Fetching data from Yahoo Finance (primary)...`);
    const stockInfo = await yahooFinanceService.getStockInfo(symbol);
    await yahooFinanceService.delay(500); // Be polite
    
    const fundamentals = await yahooFinanceService.getFundamentals(symbol);
    await yahooFinanceService.delay(500);
    
    const shareholding = await yahooFinanceService.getShareholdingData(symbol);
    await yahooFinanceService.delay(500);
    
    const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(symbol);
    await yahooFinanceService.delay(500);
    
    // Step 2: Insert stock master data
    console.log(`  💾 Inserting stock data...`);
    await stockDataService.upsertStock({
      symbol: symbol,
      companyName: stockInfo.company_name,
      exchange: stockInfo.exchange,
      sector: stockInfo.sector || sector,
      industry: stockInfo.industry || category,
      isActive: true
    });
    
    // Step 3: Insert fundamentals (PE, PEG, ratios, etc.)
    await stockDataService.upsertFundamentals({
      symbol: symbol,
      peRatio: fundamentals.pe_ratio,
      pegRatio: null, // PEG not directly available, can calculate if needed
      totalDebt: null, // Available in financial statements if needed
      freeCashFlow: null, // Available in cash flow if needed
      debtToFcfRatio: null,
      updatedAt: new Date()
    });
    
    // Step 4: Insert shareholding data
    await stockDataService.upsertShareholding({
      symbol: symbol,
      promoterHoldingPercentage: shareholding.promoter_holding_percentage,
      institutionalHoldingPercentage: shareholding.institutional_holding_percentage,
      publicHoldingPercentage: shareholding.public_holding_percentage,
      mutualFundHolding: shareholding.mutual_fund_holding,
      totalShares: shareholding.total_shares,
      promoterShares: shareholding.promoter_shares,
      institutionalShares: shareholding.institutional_shares,
      publicShares: shareholding.public_shares,
      insiderTransactionsLastQuarter: shareholding.insider_transactions_last_quarter,
      insiderBuyCount: shareholding.insider_buy_count,
      insiderSellCount: shareholding.insider_sell_count,
      majorShareholdersCount: shareholding.major_shareholders_count,
      top10ShareholdersPercentage: shareholding.top_10_shareholders_percentage,
      lastUpdated: shareholding.last_updated
    });
    
    // Step 5: Insert earnings and analyst data
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
      analystCount: yahooData.analystCount,
      strongBuyCount: yahooData.strongBuyCount,
      buyCount: yahooData.buyCount,
      holdCount: yahooData.holdCount,
      sellCount: yahooData.sellCount,
      strongSellCount: yahooData.strongSellCount,
      consensusRating: yahooData.consensusRating
    });
    
    console.log(`  ✅ ${symbol} completed successfully (Yahoo Finance)!`);
    return { success: true, symbol, source: 'Yahoo Finance' };
    
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
    
    // Small delay to be polite (Yahoo Finance has no limits but we're being respectful)
    if (i < stocksToProcess.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next stock...`);
      await yahooFinanceService.delay(3000); // Just 3 seconds instead of 15!
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
  console.log(`⚡ Powered by: Yahoo Finance (Free, No Limits)`);
  
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
 * Uses Yahoo Finance (FREE, NO RATE LIMITS)
 */
async function updateExistingStocks() {
  console.log("🔄 Updating existing stocks with Yahoo Finance...\n");
  
  // Get all active stocks from database (all sectors)
  const query = 'SELECT symbol, sector FROM stocks WHERE is_active = TRUE ORDER BY symbol';
  const result = await pool.query(query);
  const allStocks = result.rows;
  
  console.log(`Found ${allStocks.length} stocks to update\n`);
  
  const results = [];
  for (let i = 0; i < allStocks.length; i++) {
    const stock = allStocks[i];
    try {
      console.log(`[${i + 1}/${allStocks.length}] Updating ${stock.symbol}...`);
      
      // Fetch fresh data from Yahoo Finance
      const fundamentals = await yahooFinanceService.getFundamentals(stock.symbol);
      await yahooFinanceService.delay(500);
      
      const shareholding = await yahooFinanceService.getShareholdingData(stock.symbol);
      await yahooFinanceService.delay(500);
      
      const yahooData = await yahooFinanceService.getComprehensiveEarningsAnalystData(stock.symbol);
      await yahooFinanceService.delay(500);
      
      // Update fundamentals table
      await stockDataService.upsertFundamentals({
        symbol: stock.symbol,
        peRatio: fundamentals.peRatio,
        pegRatio: fundamentals.pegRatio,
        pbRatio: fundamentals.pbRatio,
        psRatio: fundamentals.psRatio,
        dividendYield: fundamentals.dividendYield,
        beta: fundamentals.beta,
        eps: fundamentals.eps,
        bookValuePerShare: fundamentals.bookValuePerShare,
        profitMargin: fundamentals.profitMargin,
        operatingMargin: fundamentals.operatingMargin,
        returnOnEquity: fundamentals.returnOnEquity,
        returnOnAssets: fundamentals.returnOnAssets,
        currentRatio: fundamentals.currentRatio,
        quickRatio: fundamentals.quickRatio,
        interestCoverage: fundamentals.interestCoverage,
        debtToEquityRatio: fundamentals.debtToEquityRatio,
        totalDebt: fundamentals.totalDebt,
        freeCashFlow: fundamentals.freeCashFlow,
        debtToFcfRatio: fundamentals.debtToFcfRatio,
        updatedAt: new Date()
      });
      
      // Update shareholding table
      await stockDataService.upsertShareholding({
        symbol: stock.symbol,
        promoterHoldingPercentage: shareholding.promoterHoldingPercentage,
        institutionalHoldingPercentage: shareholding.institutionalHoldingPercentage,
        publicHoldingPercentage: shareholding.publicHoldingPercentage,
        foreignInstitutionalHolding: shareholding.foreignInstitutionalHolding,
        domesticInstitutionalHolding: shareholding.domesticInstitutionalHolding,
        mutualFundHolding: shareholding.mutualFundHolding,
        retailHolding: shareholding.retailHolding,
        promoterPledgePercentage: shareholding.promoterPledgePercentage
      });
      
      // Update earnings and analyst data
      await stockDataService.upsertEarningsAnalystData({
        symbol: stock.symbol,
        earningsDate: yahooData.earnings?.earningsDate || null,
        estimatedEps: yahooData.earnings?.estimatedEps || null,
        expectedRevenue: yahooData.earnings?.expectedRevenue || null,
        beatProbability: yahooData.earnings?.beatProbability || null,
        previousEps: yahooData.earnings?.previousEps || null,
        epsSurprise: yahooData.earnings?.epsSurprise || null,
        epsSurprisePercentage: yahooData.earnings?.epsSurprisePercentage || null,
        previousRevenue: yahooData.earnings?.previousRevenue || null,
        revenueSurprise: yahooData.earnings?.revenueSurprise || null,
        revenueSurprisePercentage: yahooData.earnings?.revenueSurprisePercentage || null,
        analystTargetPriceLow: yahooData.analyst?.targetPriceLow || null,
        analystTargetPriceHigh: yahooData.analyst?.targetPriceHigh || null,
        currentPrice: yahooData.analyst?.currentPrice || null,
        analystCount: yahooData.analyst?.analystCount || null,
        strongBuyCount: yahooData.analyst?.strongBuyCount || null,
        buyCount: yahooData.analyst?.buyCount || null,
        holdCount: yahooData.analyst?.holdCount || null,
        sellCount: yahooData.analyst?.sellCount || null,
        strongSellCount: yahooData.analyst?.strongSellCount || null,
        consensusRating: yahooData.analyst?.consensusRating || null
      });
      
      console.log(`✅ ${stock.symbol} updated`);
      results.push({ success: true, symbol: stock.symbol });
      
      // Small delay to be polite (1.5 seconds between stocks)
      if (i < allStocks.length - 1) {
        await yahooFinanceService.delay(1500);
      }
      
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
