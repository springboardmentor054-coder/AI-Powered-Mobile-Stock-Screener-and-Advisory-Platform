CREATE TABLE stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    exchange VARCHAR(10),
    sector VARCHAR(50),
    industry VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

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

CREATE TABLE corporate_actions (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    action_type VARCHAR(50),
    announcement_date DATE,
    details TEXT,
    is_active BOOLEAN
);

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

CREATE TABLE shareholding (
    symbol VARCHAR(10) REFERENCES stocks(symbol),
    promoter_holding_percentage FLOAT,
    institutional_holding_percentage FLOAT,
    last_updated DATE,
    PRIMARY KEY (symbol)
);
