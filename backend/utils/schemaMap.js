// backend/utils/schemaMap.js

const VALID_OPERATORS = ["<", ">", "<=", ">=", "="];

const FIELD_MAP = {
  // --- 1. Companies Table ---
  "ticker_symbol": "companies",
  "company_name": "companies",
  "sector": "companies",
  "industry": "companies",
  "exchange": "companies",
  "market_cap": "companies",        // NEW: Critical for screening

  // --- 2. Valuation Metrics ---
  "pe_ratio": "valuation_metrics",
  "forward_pe": "valuation_metrics", // NEW
  "peg_ratio": "valuation_metrics",
  "pb_ratio": "valuation_metrics",
  "dividend_yield": "valuation_metrics",
  "payout_ratio": "valuation_metrics",

  // --- 3. Price Market Data ---
  "current_price": "price_market_data",
  "price_change_percent": "price_market_data", // Renamed from price_change_pct
  "fifty_two_week_high": "price_market_data",  // NEW
  "fifty_two_week_low": "price_market_data",   // NEW
  "volume": "price_market_data",

  // --- 4. Financial Metrics (The Big Merged Table) ---
  // All growth, debt, and profitability fields go here now
  "revenue": "financial_metrics",
  "revenue_growth": "financial_metrics",
  "gross_margins": "financial_metrics",
  "operating_margins": "financial_metrics",
  "profit_margins": "financial_metrics", // Renamed from netprofitmargin
  "roe": "financial_metrics",
  "roa": "financial_metrics",
  
  "total_cash": "financial_metrics",
  "total_debt": "financial_metrics",
  "debt_to_equity": "financial_metrics",
  "operating_cashflow": "financial_metrics",
  "free_cashflow": "financial_metrics",
  
  "held_percent_insiders": "financial_metrics",
  "held_percent_institutions": "financial_metrics"
};

module.exports = { FIELD_MAP, VALID_OPERATORS };