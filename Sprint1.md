## 1. Stock Master Data

This table stores basic identity information of listed stocks.

Fields:
- symbol (string): Stock ticker symbol (e.g., TCS, INFY)
- company_name (string): Full company name
- exchange (string): NSE or BSE
- sector (string): High-level sector (IT, Telecom, Hardware)
- industry (string): Sub-category (Software Services, Semiconductors)
- is_active (boolean): Whether stock is actively traded

## 2. Fundamental Financial Metrics

This table stores key financial ratios and balance sheet indicators used for screening.

Fields:
- symbol (string): Stock symbol (foreign key)
- pe_ratio (float): Price-to-Earnings ratio
- peg_ratio (float): Price/Earnings to Growth ratio
- total_debt (float): Total company debt
- free_cash_flow (float): Free cash flow generated
- debt_to_fcf_ratio (float): Debt / Free Cash Flow
- updated_at (date): Last updated date

## 3. Financial Performance (Quarterly & Yearly)

This table stores revenue and EBITDA to analyze growth trends.

Fields:
- symbol (string): Stock symbol
- period_type (string): Quarterly or Yearly
- period (string): Example: Q1-2025 or FY-2024
- revenue (float): Revenue for the period
- ebitda (float): EBITDA for the period
- revenue_yoy_growth (float): Year-over-year revenue growth %
- ebitda_yoy_growth (float): Year-over-year EBITDA growth %

## 4. Corporate Actions

This table tracks important corporate actions like buybacks.

Fields:
- symbol (string): Stock symbol
- action_type (string): Buyback, Dividend, Split
- announcement_date (date): Date of announcement
- details (string): Additional information
- is_active (boolean): Whether action is currently valid

## 5. Earnings & Analyst Data

This table stores earnings schedules and analyst expectations.

Fields:
- symbol (string): Stock symbol
- earnings_date (date): Next earnings call date
- estimated_eps (float): Analyst estimated EPS
- expected_revenue (float): Analyst expected revenue
- beat_probability (float): AI/analyst confidence score
- analyst_target_price_low (float): Low price target
- analyst_target_price_high (float): High price target
- current_price (float): Current stock price

## 6. Shareholding Pattern

This table tracks ownership details.

Fields:
- symbol (string): Stock symbol
- promoter_holding_percentage (float): Promoter ownership %
- institutional_holding_percentage (float): FII/DII holding
- last_updated (date): Last update date
