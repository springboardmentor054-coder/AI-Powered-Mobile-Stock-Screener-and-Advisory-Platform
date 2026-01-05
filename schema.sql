/* Schema for Stock Market Database */
/* This table stores basic identity information of listed stocks.
Why needed
To filter by IT sector
To show stock names in results*/

CREATE TABLE stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    exchange VARCHAR(10),
    sector VARCHAR(50),
    industry VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

/*This supports filters like PEG, PE, debt.
This table stores key financial ratios and balance sheet indicators used for screening.
Your query includes:
PEG ratio
Debt vs free cash flow*/

CREATE TABLE fundamentals (
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    pe_ratio FLOAT,
    peg_ratio FLOAT,
    total_debt NUMERIC,
    free_cash_flow NUMERIC,
    debt_to_fcf_ratio FLOAT,
    updated_at DATE,
    PRIMARY KEY (symbol)
);

--- This table stores revenue and EBITDA to analyze growth trends.

CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    period_type VARCHAR(20),
    period VARCHAR(20),
    revenue NUMERIC,
    ebitda NUMERIC,
    revenue_yoy_growth FLOAT,
    ebitda_yoy_growth FLOAT
);

/*Your query checks:
“companies that have announced stock buybacks”*/

CREATE TABLE corporate_actions (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    action_type VARCHAR(50),
    announcement_date DATE,
    details TEXT,
    is_active BOOLEAN
);

/* This table stores earnings schedules and analyst expectations.

Your query requires:
Upcoming earnings in 30 days
Likely to beat estimates*/

CREATE TABLE earnings_analyst_data (
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    earnings_date DATE,
    estimated_eps FLOAT,
    expected_revenue NUMERIC,
    beat_probability FLOAT,
    analyst_target_price_low FLOAT,
    analyst_target_price_high FLOAT,
    current_price FLOAT,
    PRIMARY KEY (symbol)
);

/*Your example includes:
“promoter holding above 50%”

This table tracks ownership details.
*/

CREATE TABLE shareholding (
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    promoter_holding_percentage FLOAT,
    institutional_holding_percentage FLOAT,
    last_updated DATE,
    PRIMARY KEY (symbol)
);
