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
    const earningsDate = calendarEvents.earnings?.earningsDate?.[0]
      ? new Date(calendarEvents.earnings.earningsDate[0] * 1000)
      : null;

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
 * Helper function to add delay between requests (optional, for being polite)
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getEarningsData,
  getAnalystData,
  getComprehensiveEarningsAnalystData,
  getCurrentPrice,
  delay
};
