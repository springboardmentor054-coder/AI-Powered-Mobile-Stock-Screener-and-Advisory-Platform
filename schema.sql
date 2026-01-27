/* Schema for Stock Market Database */

/* User Authentication Table */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP
);

/* Create index on email for faster lookups */
CREATE INDEX idx_users_email ON users(email);

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
    is_active BOOLEAN DEFAULT TRUE,
    market_cap BIGINT,
    employees INTEGER,
    founded_year INTEGER,
    headquarters VARCHAR(100),
    website VARCHAR(200),
    description TEXT,
    listing_date DATE,
    week_52_high FLOAT,
    week_52_low FLOAT,
    average_volume BIGINT,
    shares_outstanding BIGINT,
    float_shares BIGINT,
    insider_ownership_percentage FLOAT,
    institutional_ownership_percentage FLOAT,
    country VARCHAR(50)
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
    pb_ratio FLOAT,
    ps_ratio FLOAT,
    dividend_yield FLOAT,
    beta FLOAT,
    eps FLOAT,
    book_value_per_share FLOAT,
    profit_margin FLOAT,
    operating_margin FLOAT,
    return_on_equity FLOAT,
    return_on_assets FLOAT,
    current_ratio FLOAT,
    quick_ratio FLOAT,
    interest_coverage FLOAT,
    debt_to_equity_ratio FLOAT,
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
    ebitda_yoy_growth FLOAT,
    gross_profit NUMERIC,
    operating_income NUMERIC,
    net_income NUMERIC,
    gross_margin FLOAT,
    operating_margin FLOAT,
    net_margin FLOAT,
    eps_basic FLOAT,
    eps_diluted FLOAT,
    shares_outstanding BIGINT,
    cost_of_revenue NUMERIC,
    research_development NUMERIC,
    selling_general_admin NUMERIC,
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    UNIQUE(symbol, period_type, period)
);

/*Your query checks:
“companies that have announced stock buybacks”*/

CREATE TABLE corporate_actions (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    action_type VARCHAR(50),
    announcement_date DATE,
    details TEXT,
    is_active BOOLEAN,
    execution_date DATE,
    record_date DATE,
    payment_date DATE,
    amount NUMERIC,
    currency VARCHAR(10),
    status VARCHAR(20),
    impact_percentage FLOAT,
    shares_affected BIGINT,
    total_value NUMERIC,
    source VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    approval_date DATE,
    completion_date DATE,
    dividend_type VARCHAR(20)
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
    previous_eps FLOAT,
    eps_surprise FLOAT,
    eps_surprise_percentage FLOAT,
    previous_revenue NUMERIC,
    revenue_surprise NUMERIC,
    revenue_surprise_percentage FLOAT,
    analyst_count INTEGER,
    strong_buy_count INTEGER,
    buy_count INTEGER,
    hold_count INTEGER,
    sell_count INTEGER,
    strong_sell_count INTEGER,
    consensus_rating VARCHAR(20),
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
    last_updated DATE,    public_holding_percentage FLOAT,
    foreign_institutional_holding FLOAT,
    domestic_institutional_holding FLOAT,
    mutual_fund_holding FLOAT,
    retail_holding FLOAT,
    promoter_pledge_percentage FLOAT,
    shares_pledged BIGINT,
    total_shares BIGINT,
    promoter_shares BIGINT,
    institutional_shares BIGINT,
    public_shares BIGINT,
    insider_transactions_last_quarter INTEGER,
    insider_buy_count INTEGER,
    insider_sell_count INTEGER,
    major_shareholders_count INTEGER,
    top_10_shareholders_percentage FLOAT,    PRIMARY KEY (symbol)
);
