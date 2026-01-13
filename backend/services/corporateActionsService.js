require("dotenv").config();
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const db = require("../config/database");

/**
 * Corporate Actions Service
 * Fetches dividend announcements and other corporate actions from Yahoo Finance
 */

/**
 * Get dividend history and upcoming dividends
 */
async function getDividendData(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['calendarEvents', 'summaryDetail', 'defaultKeyStatistics']
    });

    const calendarEvents = result.calendarEvents || {};
    const summaryDetail = result.summaryDetail || {};
    const keyStats = result.defaultKeyStatistics || {};

    const dividends = [];

    // Upcoming dividend
    if (calendarEvents.dividendDate) {
      const dividendDate = new Date(calendarEvents.dividendDate.raw * 1000);
      const exDividendDate = summaryDetail.exDividendDate 
        ? new Date(summaryDetail.exDividendDate.raw * 1000)
        : null;
      
      dividends.push({
        symbol,
        actionType: 'dividend',
        announcementDate: exDividendDate || dividendDate,
        executionDate: dividendDate,
        paymentDate: dividendDate,
        amount: summaryDetail.dividendRate || null,
        currency: 'USD',
        status: 'announced',
        dividendType: 'cash',
        details: `Dividend payment of $${summaryDetail.dividendRate || 'TBD'} per share`,
        isActive: true,
        verified: true,
        source: 'Yahoo Finance'
      });
    }

    // Add dividend yield info if available
    if (summaryDetail.dividendYield) {
      const yieldPercent = (summaryDetail.dividendYield * 100).toFixed(2);
      if (dividends.length > 0) {
        dividends[0].impactPercentage = summaryDetail.dividendYield * 100;
      }
    }

    return dividends;

  } catch (error) {
    console.error(`Error fetching dividend data for ${symbol}:`, error.message);
    return [];
  }
}

/**
 * Get share buyback and split information
 */
async function getCorporateActionData(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['calendarEvents', 'defaultKeyStatistics', 'financialData']
    });

    const keyStats = result.defaultKeyStatistics || {};
    const financialData = result.financialData || {};
    const actions = [];

    // Check for stock splits
    if (keyStats.lastSplitDate) {
      const splitDate = new Date(keyStats.lastSplitDate.raw * 1000);
      const splitFactor = keyStats.lastSplitFactor || 'N/A';
      
      actions.push({
        symbol,
        actionType: 'stock_split',
        announcementDate: splitDate,
        executionDate: splitDate,
        details: `Stock split: ${splitFactor}`,
        status: 'completed',
        isActive: false,
        verified: true,
        source: 'Yahoo Finance',
        currency: 'USD'
      });
    }

    // Infer potential buyback from share reduction (if shares outstanding decreased)
    // This is an approximation - real buyback data requires SEC filings
    if (financialData.numberOfAnalystOpinions) {
      // Note: Actual buyback detection would need historical shares outstanding comparison
      // This is a placeholder for demonstration
    }

    return actions;

  } catch (error) {
    console.error(`Error fetching corporate action data for ${symbol}:`, error.message);
    return [];
  }
}

/**
 * Insert corporate action into database
 */
async function insertCorporateAction(actionData) {
  const {
    symbol,
    actionType,
    announcementDate,
    executionDate,
    paymentDate,
    recordDate,
    details,
    amount,
    currency,
    status,
    impactPercentage,
    sharesAffected,
    totalValue,
    isActive,
    verified,
    source,
    approvalDate,
    completionDate,
    dividendType,
    notes
  } = actionData;

  const query = `
    INSERT INTO corporate_actions (
      symbol, action_type, announcement_date, execution_date, payment_date,
      record_date, details, amount, currency, status, impact_percentage,
      shares_affected, total_value, is_active, verified, source,
      approval_date, completion_date, dividend_type, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [
      symbol,
      actionType,
      announcementDate,
      executionDate,
      paymentDate,
      recordDate,
      details,
      amount,
      currency,
      status,
      impactPercentage,
      sharesAffected,
      totalValue,
      isActive,
      verified,
      source,
      approvalDate,
      completionDate,
      dividendType,
      notes
    ]);
    return result.rows[0];
  } catch (error) {
    // Ignore duplicates or handle gracefully
    if (error.code === '23505') {
      console.log(`  ⚠️  Duplicate action for ${symbol}, skipping...`);
      return null;
    }
    console.error(`Error inserting corporate action for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get all corporate actions for a stock
 */
async function getAllCorporateActions(symbol) {
  try {
    const dividends = await getDividendData(symbol);
    const otherActions = await getCorporateActionData(symbol);
    
    return [...dividends, ...otherActions];
  } catch (error) {
    console.error(`Error fetching all corporate actions for ${symbol}:`, error.message);
    return [];
  }
}

module.exports = {
  getDividendData,
  getCorporateActionData,
  getAllCorporateActions,
  insertCorporateAction
};
