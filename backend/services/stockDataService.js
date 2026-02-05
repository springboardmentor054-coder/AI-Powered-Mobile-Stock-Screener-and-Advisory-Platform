const db = require("../config/database");

/**
 * Stock Data Service - handles all database operations for stock data
 */

/**
 * Insert or update stock master data
 */
async function upsertStock(stockData) {
  const {
    symbol,
    companyName,
    exchange,
    sector,
    industry,
    isActive = true
  } = stockData;

  const query = `
    INSERT INTO stocks (symbol, company_name, exchange, sector, industry, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (symbol)
    DO UPDATE SET
      company_name = EXCLUDED.company_name,
      exchange = EXCLUDED.exchange,
      sector = EXCLUDED.sector,
      industry = EXCLUDED.industry,
      is_active = EXCLUDED.is_active
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      companyName,
      exchange,
      sector,
      industry,
      isActive
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error upserting stock ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Insert or update fundamental metrics
 */
async function upsertFundamentals(fundamentalData) {
  const {
    symbol,
    peRatio,
    pegRatio,
    totalDebt,
    freeCashFlow,
    debtToFcfRatio,
    updatedAt = new Date()
  } = fundamentalData;

  const query = `
    INSERT INTO fundamentals (
      symbol, pe_ratio, peg_ratio, total_debt, free_cash_flow,
      debt_to_fcf_ratio, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (symbol)
    DO UPDATE SET
      pe_ratio = EXCLUDED.pe_ratio,
      peg_ratio = EXCLUDED.peg_ratio,
      total_debt = EXCLUDED.total_debt,
      free_cash_flow = EXCLUDED.free_cash_flow,
      debt_to_fcf_ratio = EXCLUDED.debt_to_fcf_ratio,
      updated_at = EXCLUDED.updated_at
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      peRatio,
      pegRatio,
      totalDebt,
      freeCashFlow,
      debtToFcfRatio,
      updatedAt
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error upserting fundamentals for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Insert financial performance data (quarterly or yearly)
 */
async function insertFinancialPerformance(financialData) {
  const {
    symbol,
    periodType,
    period,
    revenue,
    ebitda,
    revenueYoyGrowth,
    ebitdaYoyGrowth,
    grossProfit,
    operatingIncome,
    netIncome,
    grossMargin,
    operatingMargin,
    netMargin,
    epsBasic,
    epsDiluted,
    sharesOutstanding,
    costOfRevenue,
    researchDevelopment,
    sellingGeneralAdmin,
    totalAssets,
    totalLiabilities
  } = financialData;

  const query = `
    INSERT INTO financials (
      symbol, period_type, period, revenue, ebitda,
      revenue_yoy_growth, ebitda_yoy_growth, gross_profit,
      operating_income, net_income, gross_margin, operating_margin,
      net_margin, eps_basic, eps_diluted, shares_outstanding,
      cost_of_revenue, research_development, selling_general_admin,
      total_assets, total_liabilities
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (symbol, period_type, period) 
    DO UPDATE SET
      revenue = EXCLUDED.revenue,
      ebitda = EXCLUDED.ebitda,
      revenue_yoy_growth = EXCLUDED.revenue_yoy_growth,
      ebitda_yoy_growth = EXCLUDED.ebitda_yoy_growth,
      gross_profit = EXCLUDED.gross_profit,
      operating_income = EXCLUDED.operating_income,
      net_income = EXCLUDED.net_income,
      gross_margin = EXCLUDED.gross_margin,
      operating_margin = EXCLUDED.operating_margin,
      net_margin = EXCLUDED.net_margin,
      eps_basic = EXCLUDED.eps_basic,
      eps_diluted = EXCLUDED.eps_diluted,
      shares_outstanding = EXCLUDED.shares_outstanding,
      cost_of_revenue = EXCLUDED.cost_of_revenue,
      research_development = EXCLUDED.research_development,
      selling_general_admin = EXCLUDED.selling_general_admin,
      total_assets = EXCLUDED.total_assets,
      total_liabilities = EXCLUDED.total_liabilities
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      periodType,
      period,
      revenue,
      ebitda,
      revenueYoyGrowth,
      ebitdaYoyGrowth,
      grossProfit || null,
      operatingIncome || null,
      netIncome || null,
      grossMargin || null,
      operatingMargin || null,
      netMargin || null,
      epsBasic || null,
      epsDiluted || null,
      sharesOutstanding || null,
      costOfRevenue || null,
      researchDevelopment || null,
      sellingGeneralAdmin || null,
      totalAssets || null,
      totalLiabilities || null
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error inserting financials for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Batch insert financial performance data
 */
async function batchInsertFinancials(symbol, financials) {
  const results = [];
  for (const financial of financials) {
    const result = await insertFinancialPerformance({
      symbol,
      ...financial
    });
    if (result) results.push(result);
  }
  return results;
}

/**
 * Insert or update earnings and analyst data
 */
async function upsertEarningsAnalystData(earningsData) {
  const {
    symbol,
    earningsDate,
    estimatedEps,
    expectedRevenue,
    beatProbability,
    analystTargetPriceLow,
    analystTargetPriceHigh,
    currentPrice,
    previousEps,
    epsSurprise,
    epsSurprisePercentage,
    previousRevenue,
    revenueSurprise,
    revenueSurprisePercentage,
    analystCount,
    strongBuyCount,
    buyCount,
    holdCount,
    sellCount,
    strongSellCount,
    consensusRating
  } = earningsData;

  const query = `
    INSERT INTO earnings_analyst_data (
      symbol, earnings_date, estimated_eps, expected_revenue,
      beat_probability, analyst_target_price_low,
      analyst_target_price_high, current_price,
      previous_eps, eps_surprise, eps_surprise_percentage,
      previous_revenue, revenue_surprise, revenue_surprise_percentage,
      analyst_count, strong_buy_count, buy_count, hold_count,
      sell_count, strong_sell_count, consensus_rating
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (symbol)
    DO UPDATE SET
      earnings_date = EXCLUDED.earnings_date,
      estimated_eps = EXCLUDED.estimated_eps,
      expected_revenue = EXCLUDED.expected_revenue,
      beat_probability = EXCLUDED.beat_probability,
      analyst_target_price_low = EXCLUDED.analyst_target_price_low,
      analyst_target_price_high = EXCLUDED.analyst_target_price_high,
      current_price = EXCLUDED.current_price,
      previous_eps = EXCLUDED.previous_eps,
      eps_surprise = EXCLUDED.eps_surprise,
      eps_surprise_percentage = EXCLUDED.eps_surprise_percentage,
      previous_revenue = EXCLUDED.previous_revenue,
      revenue_surprise = EXCLUDED.revenue_surprise,
      revenue_surprise_percentage = EXCLUDED.revenue_surprise_percentage,
      analyst_count = EXCLUDED.analyst_count,
      strong_buy_count = EXCLUDED.strong_buy_count,
      buy_count = EXCLUDED.buy_count,
      hold_count = EXCLUDED.hold_count,
      sell_count = EXCLUDED.sell_count,
      strong_sell_count = EXCLUDED.strong_sell_count,
      consensus_rating = EXCLUDED.consensus_rating
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      earningsDate,
      estimatedEps,
      expectedRevenue,
      beatProbability,
      analystTargetPriceLow,
      analystTargetPriceHigh,
      currentPrice,
      previousEps,
      epsSurprise,
      epsSurprisePercentage,
      previousRevenue,
      revenueSurprise,
      revenueSurprisePercentage,
      analystCount,
      strongBuyCount,
      buyCount,
      holdCount,
      sellCount,
      strongSellCount,
      consensusRating
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error upserting earnings data for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Insert corporate action
 */
async function insertCorporateAction(actionData) {
  const {
    symbol,
    actionType,
    announcementDate,
    details,
    isActive = true
  } = actionData;

  const query = `
    INSERT INTO corporate_actions (
      symbol, action_type, announcement_date, details, is_active
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      actionType,
      announcementDate,
      details,
      isActive
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error inserting corporate action for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Insert or update shareholding pattern
 */
async function upsertShareholding(shareholdingData) {
  const {
    symbol,
    promoterHoldingPercentage,
    institutionalHoldingPercentage,
    lastUpdated = new Date()
  } = shareholdingData;

  const query = `
    INSERT INTO shareholding (
      symbol, promoter_holding_percentage,
      institutional_holding_percentage, last_updated
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (symbol)
    DO UPDATE SET
      promoter_holding_percentage = EXCLUDED.promoter_holding_percentage,
      institutional_holding_percentage = EXCLUDED.institutional_holding_percentage,
      last_updated = EXCLUDED.last_updated
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      promoterHoldingPercentage,
      institutionalHoldingPercentage,
      lastUpdated
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error upserting shareholding for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get all stocks by sector
 */
async function getStocksBySector(sector) {
  const query = `
    SELECT * FROM stocks
    WHERE sector = $1 AND is_active = true
    ORDER BY symbol;
  `;

  try {
    const result = await db.query(query, [sector]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching stocks for sector ${sector}:`, error.message);
    throw error;
  }
}

/**
 * Get stock with all related data
 */
async function getStockComplete(symbol) {
  const stockQuery = `SELECT * FROM stocks WHERE symbol = $1`;
  const fundamentalsQuery = `SELECT * FROM fundamentals WHERE symbol = $1`;
  const financialsQuery = `SELECT * FROM financials WHERE symbol = $1 ORDER BY period DESC`;
  const earningsQuery = `SELECT * FROM earnings_analyst_data WHERE symbol = $1`;
  const actionsQuery = `SELECT * FROM corporate_actions WHERE symbol = $1 ORDER BY announcement_date DESC`;
  const shareholdingQuery = `SELECT * FROM shareholding WHERE symbol = $1`;

  try {
    const [stock, fundamentals, financials, earnings, actions, shareholding] = await Promise.all([
      db.query(stockQuery, [symbol]),
      db.query(fundamentalsQuery, [symbol]),
      db.query(financialsQuery, [symbol]),
      db.query(earningsQuery, [symbol]),
      db.query(actionsQuery, [symbol]),
      db.query(shareholdingQuery, [symbol])
    ]);

    return {
      stock: stock.rows[0] || null,
      fundamentals: fundamentals.rows[0] || null,
      financials: financials.rows || [],
      earnings: earnings.rows[0] || null,
      corporateActions: actions.rows || [],
      shareholding: shareholding.rows[0] || null
    };
  } catch (error) {
    console.error(`Error fetching complete data for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Calculate YoY growth for financials
 */
function calculateYoyGrowth(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate debt to FCF ratio
 */
function calculateDebtToFcfRatio(totalDebt, freeCashFlow) {
  if (!freeCashFlow || freeCashFlow === 0) return null;
  return totalDebt / freeCashFlow;
}

/**
 * Insert historical price data (batch insert for efficiency)
 */
async function batchInsertPriceHistory(priceDataArray) {
  if (!priceDataArray || priceDataArray.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  try {
    let inserted = 0;
    let updated = 0;

    // Use transaction for batch insert
    await db.query('BEGIN');

    for (const priceData of priceDataArray) {
      const {
        symbol,
        date,
        open,
        high,
        low,
        close,
        volume,
        adjustedClose
      } = priceData;

      const query = `
        INSERT INTO price_history (
          symbol, date, open, high, low, close, volume, adjusted_close
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (symbol, date)
        DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          adjusted_close = EXCLUDED.adjusted_close
        RETURNING (xmax = 0) AS inserted;
      `;

      const result = await db.query(query, [
        symbol,
        date,
        open,
        high,
        low,
        close,
        volume,
        adjustedClose
      ]);

      if (result.rows[0].inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    await db.query('COMMIT');
    return { inserted, updated };

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error batch inserting price history:', error.message);
    throw error;
  }
}

/**
 * Get historical prices for a symbol within a date range
 */
async function getPriceHistory(symbol, startDate, endDate) {
  const query = `
    SELECT 
      symbol,
      date,
      open,
      high,
      low,
      close,
      volume,
      adjusted_close
    FROM price_history
    WHERE symbol = $1
      AND date >= $2
      AND date <= $3
    ORDER BY date DESC;
  `;

  try {
    const result = await db.query(query, [symbol, startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get the most recent price data for a symbol
 */
async function getLatestPrice(symbol) {
  const query = `
    SELECT *
    FROM price_history
    WHERE symbol = $1
    ORDER BY date DESC
    LIMIT 1;
  `;

  try {
    const result = await db.query(query, [symbol]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching latest price for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get price change statistics
 */
async function getPriceChangeStats(symbol, days = 30) {
  const query = `
    WITH recent_prices AS (
      SELECT close, date
      FROM price_history
      WHERE symbol = $1
      ORDER BY date DESC
      LIMIT $2
    )
    SELECT 
      MAX(close) as high,
      MIN(close) as low,
      (SELECT close FROM recent_prices ORDER BY date DESC LIMIT 1) as current_price,
      (SELECT close FROM recent_prices ORDER BY date ASC LIMIT 1) as start_price
    FROM recent_prices;
  `;

  try {
    const result = await db.query(query, [symbol, days]);
    const stats = result.rows[0];
    
    if (stats && stats.current_price && stats.start_price) {
      stats.change = stats.current_price - stats.start_price;
      stats.change_percent = ((stats.change / stats.start_price) * 100).toFixed(2);
    }
    
    return stats;
  } catch (error) {
    console.error(`Error calculating price stats for ${symbol}:`, error.message);
    throw error;
  }
}

module.exports = {
  upsertStock,
  upsertFundamentals,
  insertFinancialPerformance,
  batchInsertFinancials,
  upsertEarningsAnalystData,
  insertCorporateAction,
  upsertShareholding,
  getStocksBySector,
  getStockComplete,
  calculateYoyGrowth,
  calculateDebtToFcfRatio,
  batchInsertPriceHistory,
  getPriceHistory,
  getLatestPrice,
  getPriceChangeStats
};
