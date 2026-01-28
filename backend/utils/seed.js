// 1. Load Env Vars
require('dotenv').config();

// 2. Database Check
if (!process.env.DATABASE_URL) {
  console.error("❌ CRITICAL ERROR: DATABASE_URL is missing in .env");
  process.exit(1);
}

const db = require('../config/db');

async function runSeeder() {
  console.log("🚀 Starting Database Seeder for 50+ Companies...");

  // --- Dynamic Import for Yahoo Finance ---
  const yahooModule = await import('yahoo-finance2');
  const YahooFinance = yahooModule.YahooFinance || yahooModule.default;
  const yahooFinance = new YahooFinance(); 
  // ----------------------------------------

  // Verify DB
  try {
    const res = await db.query('SELECT NOW()');
    console.log("✅ Database Connection: OK");
  } catch (err) {
    console.error("❌ CRITICAL: Cannot connect to database.");
    console.error("Details:", err.message);
    process.exit(1);
  }

  // --- THE LIST: 50+ Diverse Companies ---
  const TICKERS = [
    // Tech & AI
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'ORCL', 'ADBE', 
    'CRM', 'AMD', 'INTC', 'QCOM', 'TXN', 'IBM', 'UBER', 'ABNB', 'PLTR', 'PANW',
    
    // Finance & Banks
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK',
    
    // Consumer & Retail
    'WMT', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'DIS', 'HD',
    'LOW', 'TGT', 'EL', 'CL', 'MO',
    
    // Healthcare
    'JNJ', 'PFE', 'UNH', 'LLY', 'MRK', 'ABBV', 'TMO', 'DHR', 'BMY', 'AMGN',
    
    // Industrial & Energy
    'XOM', 'CVX', 'GE', 'CAT', 'BA', 'UPS', 'MMM', 'HON', 'LIN', 'NEE'
  ];

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (const ticker of TICKERS) {
    try {
      console.log(`\n📥 Fetching data for: ${ticker}...`);

      // Suppress survey warnings if function exists
      if (typeof yahooFinance.suppressNotices === 'function') {
         yahooFinance.suppressNotices(['yahooSurvey']);
      }

      // Fetch Data
      const result = await yahooFinance.quoteSummary(ticker, {
        modules: [ "price", "summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile" ]
      });

      const price = result.price || {};
      const summary = result.summaryDetail || {};
      const stats = result.defaultKeyStatistics || {};
      const financials = result.financialData || {};
      const profile = result.assetProfile || {};

      // ---------------------------------------------------------
      // 1. INSERT or UPDATE Company
      // The "ON CONFLICT" clause prevents duplicates!
      // ---------------------------------------------------------
      const companyRes = await db.query(
        `INSERT INTO companies (
          ticker_symbol, company_name, sector, industry, exchange, 
          currency, description, market_cap, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (ticker_symbol) DO UPDATE SET 
          market_cap = EXCLUDED.market_cap,
          updated_at = NOW()
        RETURNING id`,
        [
          ticker,
          price.longName,
          profile.sector,
          profile.industry,
          price.exchangeName,
          price.currency,
          profile.longBusinessSummary,
          price.marketCap
        ]
      );
      const companyId = companyRes.rows[0].id;

      // ---------------------------------------------------------
      // 2. INSERT or UPDATE Valuation
      // ---------------------------------------------------------
      await db.query(
        `INSERT INTO valuation_metrics (
          company_id, pe_ratio, forward_pe, peg_ratio, pb_ratio, 
          dividend_rate, dividend_yield, payout_ratio, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (company_id) DO UPDATE SET
          pe_ratio = EXCLUDED.pe_ratio,
          updated_at = NOW()`,
        [
          companyId,
          summary.trailingPE,
          summary.forwardPE,
          stats.pegRatio,
          stats.priceToBook,
          summary.dividendRate,
          summary.dividendYield,
          summary.payoutRatio
        ]
      );

      // ---------------------------------------------------------
      // 3. INSERT or UPDATE Price Data
      // ---------------------------------------------------------
      await db.query(
        `INSERT INTO price_market_data (
          company_id, current_price, open_price, high_price, low_price, 
          close_price, volume, avg_volume, fifty_two_week_high, 
          fifty_two_week_low, price_change_percent, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (company_id) DO UPDATE SET
          current_price = EXCLUDED.current_price,
          updated_at = NOW()`,
        [
          companyId,
          price.regularMarketPrice,
          price.regularMarketOpen,
          price.regularMarketDayHigh,
          price.regularMarketDayLow,
          price.regularMarketPreviousClose,
          price.regularMarketVolume,
          price.averageDailyVolume10Day,
          summary.fiftyTwoWeekHigh,
          summary.fiftyTwoWeekLow,
          price.regularMarketChangePercent
        ]
      );

      // ---------------------------------------------------------
      // 4. INSERT or UPDATE Financials
      // ---------------------------------------------------------
      await db.query(
        `INSERT INTO financial_metrics (
          company_id, revenue, revenue_growth, gross_margins, 
          operating_margins, profit_margins, roe, roa,
          total_cash, total_debt, debt_to_equity, 
          operating_cashflow, free_cashflow,
          held_percent_insiders, held_percent_institutions, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (company_id) DO UPDATE SET
          total_debt = EXCLUDED.total_debt,
          updated_at = NOW()`,
        [
          companyId,
          financials.totalRevenue,
          financials.revenueGrowth,
          financials.grossMargins,
          financials.operatingMargins,
          financials.profitMargins,
          financials.returnOnEquity,
          financials.returnOnAssets,
          financials.totalCash,
          financials.totalDebt,
          financials.debtToEquity,
          financials.operatingCashflow,
          financials.freeCashflow,
          stats.heldPercentInsiders,
          stats.heldPercentInstitutions
        ]
      );

      console.log(`✅ Success: ${ticker}`);

    } catch (err) {
      console.error(`❌ Error fetching ${ticker}:`, err.message);
    }
    
    // Polite delay to avoid Yahoo blocking us
    await delay(1200);
  }
  
  console.log("\n✨ Seeding Complete!");
  process.exit(0);
}

runSeeder();