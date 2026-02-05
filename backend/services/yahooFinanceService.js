// Using yahoo-finance2 v3.x - requires class instantiation
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

/**
 * Yahoo Finance Service
 * Provides earnings estimates, analyst ratings, and target prices
 * Free, no API key required, no rate limits (reasonable use)
 */

/**
 * Get earnings calendar and estimates for a stock
 * Returns: earnings date, estimated EPS, analyst expectations
 */
async function getEarningsData(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'earningsHistory',
        'earningsTrend',
        'calendarEvents',
        'earnings'
      ]
    });

    const calendarEvents = result.calendarEvents || {};
    const earningsTrend = result.earningsTrend?.trend || [];
    const earningsHistory = result.earningsHistory?.history || [];

    // Get next earnings date
    // Yahoo Finance sometimes returns invalid future dates (year 58000+), so we validate
    let earningsDate = null;
    if (calendarEvents.earnings?.earningsDate?.[0]) {
      const date = new Date(calendarEvents.earnings.earningsDate[0] * 1000);
      // Only accept dates within reasonable range (next 2 years)
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      if (date < twoYearsFromNow) {
        earningsDate = date;
      }
    }

    // Get current quarter estimate
    const currentQuarter = earningsTrend.find(t => t.period === '0q') || earningsTrend[0];
    const estimatedEps = currentQuarter?.earningsEstimate?.avg || null;
    const expectedRevenue = currentQuarter?.revenueEstimate?.avg || null;

    // Calculate beat probability based on historical performance
    let beatProbability = null;
    if (earningsHistory.length > 0) {
      const beats = earningsHistory.filter(h => 
        h.epsActual && h.epsEstimate && h.epsActual > h.epsEstimate
      ).length;
      beatProbability = earningsHistory.length > 0 
        ? (beats / earningsHistory.length) * 100 
        : null;
    }

    // Get previous quarter data for surprise calculation
    const previousQuarter = earningsHistory[0] || {};
    const previousEps = previousQuarter.epsActual || null;
    const epsSurprise = previousQuarter.epsActual && previousQuarter.epsEstimate
      ? previousQuarter.epsActual - previousQuarter.epsEstimate
      : null;
    const epsSurprisePercentage = previousQuarter.epsActual && previousQuarter.epsEstimate && previousQuarter.epsEstimate !== 0
      ? ((previousQuarter.epsActual - previousQuarter.epsEstimate) / Math.abs(previousQuarter.epsEstimate)) * 100
      : null;

    return {
      symbol,
      earningsDate,
      estimatedEps,
      expectedRevenue,
      beatProbability,
      previousEps,
      epsSurprise,
      epsSurprisePercentage
    };

  } catch (error) {
    console.error(`Error fetching earnings data for ${symbol}:`, error.message);
    return {
      symbol,
      earningsDate: null,
      estimatedEps: null,
      expectedRevenue: null,
      beatProbability: null,
      previousEps: null,
      epsSurprise: null,
      epsSurprisePercentage: null
    };
  }
}

/**
 * Get analyst recommendations and target prices
 * Returns: analyst ratings, target prices, consensus
 */
async function getAnalystData(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'recommendationTrend',
        'financialData',
        'price'
      ]
    });

    const recommendationTrend = result.recommendationTrend?.trend?.[0] || {};
    const financialData = result.financialData || {};
    const price = result.price || {};

    // Get analyst counts
    const strongBuyCount = recommendationTrend.strongBuy || 0;
    const buyCount = recommendationTrend.buy || 0;
    const holdCount = recommendationTrend.hold || 0;
    const sellCount = recommendationTrend.sell || 0;
    const strongSellCount = recommendationTrend.strongSell || 0;

    const analystCount = strongBuyCount + buyCount + holdCount + sellCount + strongSellCount;

    // Calculate consensus rating
    let consensusRating = 'Hold';
    if (analystCount > 0) {
      const weightedScore = (
        strongBuyCount * 5 +
        buyCount * 4 +
        holdCount * 3 +
        sellCount * 2 +
        strongSellCount * 1
      ) / analystCount;

      if (weightedScore >= 4.5) consensusRating = 'Strong Buy';
      else if (weightedScore >= 3.5) consensusRating = 'Buy';
      else if (weightedScore >= 2.5) consensusRating = 'Hold';
      else if (weightedScore >= 1.5) consensusRating = 'Sell';
      else consensusRating = 'Strong Sell';
    }

    // Get target prices
    const analystTargetPriceLow = financialData.targetLowPrice || null;
    const analystTargetPriceHigh = financialData.targetHighPrice || null;
    const currentPrice = price.regularMarketPrice || financialData.currentPrice || null;

    return {
      symbol,
      analystTargetPriceLow,
      analystTargetPriceHigh,
      currentPrice,
      analystCount,
      strongBuyCount,
      buyCount,
      holdCount,
      sellCount,
      strongSellCount,
      consensusRating
    };

  } catch (error) {
    console.error(`Error fetching analyst data for ${symbol}:`, error.message);
    return {
      symbol,
      analystTargetPriceLow: null,
      analystTargetPriceHigh: null,
      currentPrice: null,
      analystCount: null,
      strongBuyCount: null,
      buyCount: null,
      holdCount: null,
      sellCount: null,
      strongSellCount: null,
      consensusRating: null
    };
  }
}

/**
 * Get comprehensive earnings and analyst data for a stock
 * Combines earnings estimates and analyst ratings
 */
async function getComprehensiveEarningsAnalystData(symbol) {
  try {
    console.log(`  Fetching Yahoo Finance data for ${symbol}...`);

    // Fetch both earnings and analyst data
    const [earningsData, analystData] = await Promise.all([
      getEarningsData(symbol),
      getAnalystData(symbol)
    ]);

    // Combine the data
    return {
      symbol,
      ...earningsData,
      ...analystData
    };

  } catch (error) {
    console.error(`Error fetching comprehensive data for ${symbol}:`, error.message);
    return {
      symbol,
      earningsDate: null,
      estimatedEps: null,
      expectedRevenue: null,
      beatProbability: null,
      analystTargetPriceLow: null,
      analystTargetPriceHigh: null,
      currentPrice: null,
      previousEps: null,
      epsSurprise: null,
      epsSurprisePercentage: null,
      analystCount: null,
      strongBuyCount: null,
      buyCount: null,
      holdCount: null,
      sellCount: null,
      strongSellCount: null,
      consensusRating: null
    };
  }
}

/**
 * Get current stock price (for quick updates)
 */
async function getCurrentPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote.regularMarketPrice || null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Get key statistics including shares outstanding
 * Returns: shares outstanding, float shares, etc.
 */
async function getKeyStatistics(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['defaultKeyStatistics']
    });

    const stats = result.defaultKeyStatistics || {};

    return {
      symbol,
      sharesOutstanding: stats.sharesOutstanding || null,
      floatShares: stats.floatShares || null,
      sharesShort: stats.sharesShort || null,
      shortRatio: stats.shortRatio || null,
      heldPercentInsiders: stats.heldPercentInsiders || null,
      heldPercentInstitutions: stats.heldPercentInstitutions || null
    };

  } catch (error) {
    console.error(`Error fetching key statistics for ${symbol}:`, error.message);
    return {
      symbol,
      sharesOutstanding: null,
      floatShares: null,
      sharesShort: null,
      shortRatio: null,
      heldPercentInsiders: null,
      heldPercentInstitutions: null
    };
  }
}

/**
 * Get comprehensive fundamental metrics for a stock
 * Returns: beta, ratios (PB, PS, PE), dividend yield, EPS, margins, liquidity ratios, etc.
 */
async function getFundamentals(symbol) {
  try {
    // Get quote for EPS
    const quote = await yahooFinance.quote(symbol);
    
    // Get comprehensive data from multiple modules
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'defaultKeyStatistics',
        'summaryDetail',
        'financialData'
      ]
    });

    const keyStats = result.defaultKeyStatistics || {};
    const summary = result.summaryDetail || {};
    const financial = result.financialData || {};

    return {
      symbol,
      // Valuation Ratios
      pb_ratio: keyStats.priceToBook || null,
      ps_ratio: summary.priceToSalesTrailing12Months || null,
      pe_ratio: summary.trailingPE || null,
      
      // Dividend & Risk
      dividend_yield: summary.dividendYield || null,
      beta: keyStats.beta || summary.beta || null,
      
      // Earnings
      eps: quote.epsTrailingTwelveMonths || null,
      book_value_per_share: keyStats.bookValue || null,
      
      // Profitability Margins
      profit_margin: financial.profitMargins || keyStats.profitMargins || null,
      operating_margin: financial.operatingMargins || null,
      return_on_equity: financial.returnOnEquity || null,
      return_on_assets: financial.returnOnAssets || null,
      
      // Liquidity Ratios
      current_ratio: financial.currentRatio || null,
      quick_ratio: financial.quickRatio || null,
      
      // Leverage
      debt_to_equity_ratio: financial.debtToEquity || null,
      interest_coverage: keyStats.interestCoverage || null,
    };
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get comprehensive shareholding/ownership data for a stock
 * Returns: insider holdings, institutional holdings, mutual fund holdings, insider transactions
 */
async function getShareholdingData(symbol) {
  try {
    // Get comprehensive ownership data from multiple modules
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'majorHoldersBreakdown',
        'institutionOwnership',
        'fundOwnership',
        'insiderTransactions',
        'defaultKeyStatistics'
      ]
    });

    const majorHolders = result.majorHoldersBreakdown || {};
    const institutional = result.institutionOwnership?.ownershipList || [];
    const funds = result.fundOwnership?.ownershipList || [];
    const transactions = result.insiderTransactions?.transactions || [];
    const keyStats = result.defaultKeyStatistics || {};

    // Calculate shareholding percentages
    const insiderPercent = majorHolders.insidersPercentHeld 
      ? majorHolders.insidersPercentHeld * 100 
      : null;
    const institutionalPercent = majorHolders.institutionsPercentHeld 
      ? majorHolders.institutionsPercentHeld * 100 
      : null;
    const publicPercent = (insiderPercent !== null && institutionalPercent !== null)
      ? Math.max(0, 100 - insiderPercent - institutionalPercent)
      : null;

    // Calculate mutual fund holdings from fund ownership list
    const mutualFundPercent = funds.length > 0
      ? funds.reduce((sum, fund) => sum + (fund.pctHeld || 0), 0) * 100
      : null;

    // Count insider transactions in last quarter (approx 90 days)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = transactions.filter(tx => {
      if (!tx.startDate) return false;
      const txDate = new Date(tx.startDate);
      return txDate >= threeMonthsAgo;
    });

    const insiderBuyCount = recentTransactions.filter(tx => 
      tx.transactionText && tx.transactionText.toLowerCase().includes('purchase')
    ).length;

    const insiderSellCount = recentTransactions.filter(tx => 
      tx.transactionText && (
        tx.transactionText.toLowerCase().includes('sale') ||
        tx.transactionText.toLowerCase().includes('sell')
      )
    ).length;

    // Count major shareholders and calculate top 10 percentage
    const top10Percent = institutional.length > 0
      ? institutional.slice(0, 10).reduce((sum, holder) => sum + (holder.pctHeld || 0), 0) * 100
      : null;

    // Get shares outstanding for calculations
    const sharesOutstanding = keyStats.sharesOutstanding || null;
    const floatShares = keyStats.floatShares || null;

    return {
      symbol,
      // Ownership percentages
      promoter_holding_percentage: insiderPercent, // In US context, promoter = insider
      institutional_holding_percentage: institutionalPercent,
      public_holding_percentage: publicPercent,
      mutual_fund_holding: mutualFundPercent,
      
      // Share counts
      total_shares: sharesOutstanding,
      promoter_shares: (sharesOutstanding && insiderPercent) 
        ? Math.round(sharesOutstanding * insiderPercent / 100)
        : null,
      institutional_shares: (sharesOutstanding && institutionalPercent)
        ? Math.round(sharesOutstanding * institutionalPercent / 100)
        : null,
      public_shares: (sharesOutstanding && publicPercent)
        ? Math.round(sharesOutstanding * publicPercent / 100)
        : null,
      
      // Insider transactions
      insider_transactions_last_quarter: recentTransactions.length,
      insider_buy_count: insiderBuyCount,
      insider_sell_count: insiderSellCount,
      
      // Major shareholders
      major_shareholders_count: institutional.length,
      top_10_shareholders_percentage: top10Percent,
      
      // Additional fields (not available in Yahoo Finance for US stocks)
      foreign_institutional_holding: null, // US-specific data not split this way
      domestic_institutional_holding: null, // US-specific data not split this way
      retail_holding: null, // Not separately reported
      promoter_pledge_percentage: null, // US concept different from India
      shares_pledged: null, // US concept different from India
      
      last_updated: new Date()
    };
  } catch (error) {
    console.error(`Error fetching shareholding data for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get comprehensive stock information
 * Returns: company details, market data, profile, description, etc.
 */
async function getStockInfo(symbol) {
  try {
    // Get comprehensive data from multiple modules
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'assetProfile',
        'price',
        'summaryDetail',
        'defaultKeyStatistics'
      ]
    });

    const profile = result.assetProfile || {};
    const price = result.price || {};
    const summary = result.summaryDetail || {};
    const stats = result.defaultKeyStatistics || {};

    // Build headquarters string
    const headquarters = [profile.city, profile.state, profile.country]
      .filter(Boolean)
      .join(', ') || null;

    return {
      symbol,
      company_name: price.longName || price.shortName || null,
      exchange: price.exchange || null,
      sector: profile.sector || null,
      industry: profile.industry || null,
      market_cap: price.marketCap || null,
      employees: profile.fullTimeEmployees || null,
      founded_year: null, // Not available in Yahoo Finance
      headquarters: headquarters,
      website: profile.website || null,
      description: profile.longBusinessSummary || null,
      listing_date: null, // Not available in Yahoo Finance
      week_52_high: summary.fiftyTwoWeekHigh || null,
      week_52_low: summary.fiftyTwoWeekLow || null,
      average_volume: summary.averageVolume || null,
      shares_outstanding: stats.sharesOutstanding || null,
      float_shares: stats.floatShares || null,
      insider_ownership_percentage: stats.heldPercentInsiders 
        ? stats.heldPercentInsiders * 100 
        : null,
      institutional_ownership_percentage: stats.heldPercentInstitutions
        ? stats.heldPercentInstitutions * 100
        : null,
      country: profile.country || null,
      currency: price.currency || null
    };
  } catch (error) {
    console.error(`Error fetching stock info for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Helper function to add delay between requests (optional, for being polite)
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get historical price data for a stock
 * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
 * @param {string} period1 - Start date (YYYY-MM-DD)
 * @param {string} period2 - End date (YYYY-MM-DD)
 * @returns {Array} Array of daily price data
 */
async function getHistoricalPrices(symbol, period1, period2) {
  try {
    console.log(`Fetching historical data for ${symbol} from ${period1} to ${period2}...`);
    
    const result = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval: '1d' // daily data
    });

    if (!result || result.length === 0) {
      console.log(`No historical data available for ${symbol}`);
      return [];
    }

    console.log(`✓ Fetched ${result.length} days of historical data for ${symbol}`);

    // Format the data
    return result.map(day => ({
      symbol: symbol.replace('.NS', '').replace('.BO', ''),
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      volume: day.volume,
      adjustedClose: day.adjClose || day.close
    }));

  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    return [];
  }
}

/**
 * Get recent historical data (last N days)
 * @param {string} symbol - Stock symbol
 * @param {number} days - Number of days to fetch (default 30)
 */
async function getRecentHistory(symbol, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const period1 = startDate.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];

  return getHistoricalPrices(symbol, period1, period2);
}

/**
 * Convert quarter string (e.g., "1Q2025", "4Q2024") to date (e.g., "2025-01-01", "2024-10-01")
 */
function quarterStringToDate(quarterStr) {
  if (!quarterStr || typeof quarterStr !== 'string') return null;
  
  // Match patterns like "1Q2025", "4Q2024", etc.
  const match = quarterStr.match(/^(\d)Q(\d{4})$/);
  if (!match) return quarterStr; // Return as-is if not a quarter format
  
  const quarter = parseInt(match[1]);
  const year = match[2];
  
  // Map quarter to month (quarter start dates)
  const quarterToMonth = {
    1: '01', // Q1 starts in January
    2: '04', // Q2 starts in April
    3: '07', // Q3 starts in July
    4: '10'  // Q4 starts in October
  };
  
  const month = quarterToMonth[quarter];
  if (!month) return null;
  
  return `${year}-${month}-01`;
}

/**
 * Get quarterly financial statements data
 * Returns: quarterly income statements with revenue, net income, gross profit, etc.
 * Uses the quoteSummary API with financialData module
 */
async function getQuarterlyFinancials(symbol) {
  try {
    console.log(`  Fetching quarterly financials for ${symbol}...`);
    
    // Try to get financial data from quoteSummary
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics', 'earnings']
    });

    const financialData = result.financialData || {};
    const earnings = result.earnings || {};
    const quarterlyEarnings = earnings.financialsChart?.quarterly || [];

    if (quarterlyEarnings.length === 0) {
      console.log(`  ⚠️  No quarterly financial data available for ${symbol}`);
      return [];
    }

    // Process the quarterly earnings data
    const financials = quarterlyEarnings.map(quarter => {
      const revenue = quarter.revenue?.raw || null;
      const earnings = quarter.earnings?.raw || null;
      
      // Convert quarter string to proper date format
      const quarterDate = quarterStringToDate(quarter.date);
      
      // We can't get all metrics from this API, so we'll populate what we can
      return {
        quarter: quarterDate || quarter.date,
        revenue: revenue,
        net_income: earnings,
        gross_profit: null, // Not available in this module
        operating_income: null, // Not available in this module
        ebitda: null, // Not available in this module
        eps: earnings, // Using earnings as a proxy for EPS
        gross_margin: null,
        operating_margin: null,
        net_margin: (earnings && revenue && revenue !== 0) 
          ? (earnings / revenue) * 100 
          : null
      };
    });

    // Sort by date descending (most recent first)
    financials.sort((a, b) => new Date(b.quarter) - new Date(a.quarter));

    console.log(`  ✓ Found ${financials.length} quarters of financial data`);
    return financials;

  } catch (error) {
    console.error(`  ❌ Error fetching quarterly financials for ${symbol}:`, error.message);
    return [];
  }
}

module.exports = {
  getEarningsData,
  getAnalystData,
  getComprehensiveEarningsAnalystData,
  getCurrentPrice,
  getKeyStatistics,
  getFundamentals,
  getShareholdingData,
  getStockInfo,
  getHistoricalPrices,
  getRecentHistory,
  getQuarterlyFinancials,
  delay
};
