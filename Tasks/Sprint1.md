## 1. Stock Master Data

This table stores basic identity information of listed stocks. Enhanced with 20 comprehensive fields to support detailed company analysis, market metrics, and investor insights.

Fields:
- symbol (string): Stock ticker symbol (e.g., TCS, INFY)
- company_name (string): Full company name
- exchange (string): NSE or BSE
- sector (string): High-level sector (IT, Telecom, Hardware)
- industry (string): Sub-category (Software Services, Semiconductors)
- is_active (boolean): Whether stock is actively traded
- market_cap (bigint): Market capitalization in base currency
- employees (integer): Total number of employees
- founded_year (integer): Year company was founded
- headquarters (string): Corporate headquarters location
- website (string): Company website URL
- description (text): Detailed company description
- listing_date (date): Date stock was listed on exchange
- week_52_high (float): 52-week high price
- week_52_low (float): 52-week low price
- average_volume (bigint): Average daily trading volume
- shares_outstanding (bigint): Total shares outstanding
- float_shares (bigint): Publicly traded float shares
- insider_ownership_percentage (float): Insider ownership percentage
- institutional_ownership_percentage (float): Institutional ownership percentage
- country (string): Country of incorporation

## 2. Fundamental Financial Metrics

This table stores key financial ratios and balance sheet indicators used for screening. Expanded to 21 fields covering valuation ratios, profitability metrics, liquidity measures, and leverage indicators essential for comprehensive fundamental analysis.

Fields:
- symbol (string): Stock symbol (foreign key)
- pe_ratio (float): Price-to-Earnings ratio
- peg_ratio (float): Price/Earnings to Growth ratio
- total_debt (numeric): Total company debt
- free_cash_flow (numeric): Free cash flow generated
- debt_to_fcf_ratio (float): Debt / Free Cash Flow
- updated_at (date): Last updated date
- pb_ratio (float): Price-to-Book ratio
- ps_ratio (float): Price-to-Sales ratio
- dividend_yield (float): Annual dividend yield percentage
- beta (float): Stock volatility relative to market
- eps (float): Earnings per share
- book_value_per_share (float): Book value per share
- profit_margin (float): Net profit margin percentage
- operating_margin (float): Operating profit margin percentage
- return_on_equity (float): Return on equity (ROE) percentage
- return_on_assets (float): Return on assets (ROA) percentage
- current_ratio (float): Current assets / Current liabilities
- quick_ratio (float): Quick assets / Current liabilities
- interest_coverage (float): EBIT / Interest expense
- debt_to_equity_ratio (float): Total debt / Total equity

## 3. Financial Performance (Quarterly & Yearly)

This table stores revenue and EBITDA to analyze growth trends. Enhanced with 22 fields to capture comprehensive income statement data, profitability metrics, per-share metrics, and complete financial position for detailed performance analysis.

Fields:
- id (serial): Primary key
- symbol (string): Stock symbol
- period_type (string): Quarterly or Yearly
- period (string): Example: Q1-2025 or FY-2024
- revenue (numeric): Revenue for the period
- ebitda (numeric): EBITDA for the period
- revenue_yoy_growth (float): Year-over-year revenue growth %
- ebitda_yoy_growth (float): Year-over-year EBITDA growth %
- gross_profit (numeric): Gross profit amount
- operating_income (numeric): Operating income/EBIT
- net_income (numeric): Net income after taxes
- gross_margin (float): Gross profit margin percentage
- operating_margin (float): Operating margin percentage
- net_margin (float): Net profit margin percentage
- eps_basic (float): Basic earnings per share
- eps_diluted (float): Diluted earnings per share
- shares_outstanding (bigint): Number of shares outstanding
- cost_of_revenue (numeric): Cost of goods sold / Cost of revenue
- research_development (numeric): R&D expenses
- selling_general_admin (numeric): SG&A expenses
- total_assets (numeric): Total assets on balance sheet
- total_liabilities (numeric): Total liabilities on balance sheet

## 4. Corporate Actions

This table tracks important corporate actions like buybacks. Expanded to 20 fields to capture comprehensive lifecycle data including all critical dates, financial impact, verification status, and action-specific details for thorough tracking and analysis.

Fields:
- id (serial): Primary key
- symbol (string): Stock symbol
- action_type (string): Buyback, Dividend, Split, Rights Issue, etc.
- announcement_date (date): Date of announcement
- details (text): Additional information
- is_active (boolean): Whether action is currently valid
- execution_date (date): Date action was executed
- record_date (date): Record date for eligibility
- payment_date (date): Payment/settlement date
- amount (numeric): Monetary amount involved
- currency (string): Currency code (USD, INR, etc.)
- status (string): Pending, Completed, Cancelled
- impact_percentage (float): Impact on shares/price percentage
- shares_affected (bigint): Number of shares involved
- total_value (numeric): Total value of the action
- source (string): Data source or announcement source
- verified (boolean): Whether action has been verified
- notes (text): Additional notes or details
- approval_date (date): Board/shareholder approval date
- completion_date (date): Final completion date
- dividend_type (string): For dividends: Interim, Final, Special

## 5. Earnings & Analyst Data

This table stores earnings schedules and analyst expectations. Enhanced with 21 fields to track historical performance, estimate surprises, comprehensive analyst ratings distribution, consensus recommendations, and target price ranges for informed investment decisions.

Fields:
- symbol (string): Stock symbol
- earnings_date (date): Next earnings call date
- estimated_eps (float): Analyst estimated EPS
- expected_revenue (numeric): Analyst expected revenue
- beat_probability (float): AI/analyst confidence score
- analyst_target_price_low (float): Low price target
- analyst_target_price_high (float): High price target
- current_price (float): Current stock price
- previous_eps (float): Previous quarter/year actual EPS
- eps_surprise (float): Actual EPS minus estimated EPS
- eps_surprise_percentage (float): EPS surprise as percentage
- previous_revenue (numeric): Previous quarter/year actual revenue
- revenue_surprise (numeric): Actual revenue minus estimated revenue
- revenue_surprise_percentage (float): Revenue surprise as percentage
- analyst_count (integer): Total number of analysts covering stock
- strong_buy_count (integer): Number of Strong Buy ratings
- buy_count (integer): Number of Buy ratings
- hold_count (integer): Number of Hold ratings
- sell_count (integer): Number of Sell ratings
- strong_sell_count (integer): Number of Strong Sell ratings
- consensus_rating (string): Consensus recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)

## 6. Shareholding Pattern

This table tracks ownership details. Expanded to 20 fields to provide granular visibility into ownership distribution across investor categories, promoter pledge data, insider trading activity, and shareholding concentration metrics for comprehensive ownership analysis.

Fields:
- symbol (string): Stock symbol
- promoter_holding_percentage (float): Promoter ownership %
- institutional_holding_percentage (float): FII/DII holding %
- last_updated (date): Last update date
- public_holding_percentage (float): Public shareholding %
- foreign_institutional_holding (float): Foreign institutional investors %
- domestic_institutional_holding (float): Domestic institutional investors %
- mutual_fund_holding (float): Mutual fund holdings %
- retail_holding (float): Retail investor holdings %
- promoter_pledge_percentage (float): Percentage of promoter shares pledged
- shares_pledged (bigint): Number of shares pledged
- total_shares (bigint): Total shares in company
- promoter_shares (bigint): Number of shares held by promoters
- institutional_shares (bigint): Number of shares held by institutions
- public_shares (bigint): Number of shares held by public
- insider_transactions_last_quarter (integer): Count of insider transactions
- insider_buy_count (integer): Number of insider buy transactions
- insider_sell_count (integer): Number of insider sell transactions
- major_shareholders_count (integer): Count of major shareholders (>1%)
- top_10_shareholders_percentage (float): Ownership percentage of top 10 shareholders

---

**Note:** All tables have been expanded from 6-8 basic fields to 20+ comprehensive fields per instructor requirements. These enhanced fields support advanced screening queries, detailed fundamental analysis, comprehensive corporate action tracking, and in-depth ownership pattern analysis essential for professional-grade stock market applications.

1E1M5U84QO50L7FK - Alpha Vantage