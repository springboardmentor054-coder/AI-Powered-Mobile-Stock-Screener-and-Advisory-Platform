CREATE TABLE company (
    company_id SERIAL PRIMARY KEY,

    ticker_symbol VARCHAR(15) UNIQUE NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    sector VARCHAR(50),
    industry VARCHAR(80),
    exchange VARCHAR(10), -- NSE / BSE
    isin_code VARCHAR(20),

    founded_year INT,
    headquarters VARCHAR(100),
    employees_count INT,
    website_url TEXT,

    business_summary TEXT,
    market_status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fundamentals (
    fundamental_id SERIAL PRIMARY KEY,
    company_id INT UNIQUE REFERENCES company(company_id) ON DELETE CASCADE,

    pe_ratio FLOAT,
    pb_ratio FLOAT,
    peg_ratio FLOAT,
    roe FLOAT,
    roic FLOAT,

    revenue_yoy_growth FLOAT,
    eps_yoy_growth FLOAT,
    revenue_5y_cagr FLOAT,
    eps_5y_cagr FLOAT,

    net_profit_margin FLOAT,
    operating_margin FLOAT,
    gross_margin FLOAT,
    ebitda_margin FLOAT,

    debt_to_equity FLOAT,
    interest_coverage FLOAT,

    fundamental_score INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analyst_target (
    analyst_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES company(company_id) ON DELETE CASCADE,

    analyst_rating VARCHAR(20),
    target_price_avg FLOAT,
    target_price_high FLOAT,
    target_price_low FLOAT,

    buy_rating_pct FLOAT,
    hold_rating_pct FLOAT,
    sell_rating_pct FLOAT,

    number_of_analysts INT,
    rating_trend VARCHAR(20),

    last_updated DATE,
    data_source VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quarterly_financials (
    quarter_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES company(company_id) ON DELETE CASCADE,

    fiscal_year INT,
    fiscal_quarter VARCHAR(5), -- Q1 Q2 Q3 Q4

    revenue BIGINT,
    net_profit BIGINT,
    operating_profit BIGINT,

    eps FLOAT,
    operating_margin FLOAT,
    net_margin FLOAT,

    total_assets BIGINT,
    total_liabilities BIGINT,

    cash_flow_operating BIGINT,

    yoy_revenue_growth FLOAT,
    yoy_profit_growth FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES company(company_id) ON DELETE CASCADE,

    event_type VARCHAR(50), -- Dividend, Split, Buyback, Merger
    event_title VARCHAR(150),
    event_description TEXT,

    announcement_date DATE,
    effective_date DATE,

    expected_impact VARCHAR(20), -- Positive / Neutral / Negative
    impact_score FLOAT,

    source VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);