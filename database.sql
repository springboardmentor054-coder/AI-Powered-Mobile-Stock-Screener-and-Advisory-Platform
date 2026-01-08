# Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) CHECK (role IN ('Investor', 'Admin')),
    subscription_type VARCHAR(30) CHECK (subscription_type IN ('Free', 'Premium')),
    account_status VARCHAR(20) CHECK (account_status IN ('Active', 'Inactive')),
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    preferred_language VARCHAR(20),
    country VARCHAR(50),
    timezone VARCHAR(50),
    kyc_status BOOLEAN DEFAULT FALSE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_flag BOOLEAN DEFAULT FALSE
);

# Query request
CREATE TABLE query_request (
    query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    natural_language_query TEXT NOT NULL,
    parsed_dsl_json JSON,
    query_type VARCHAR(50),
    api_request_id VARCHAR(100),
    authentication_status BOOLEAN,
    validation_status BOOLEAN,
    execution_status VARCHAR(20),
    execution_time_ms INT,
    sql_query TEXT,
    error_message TEXT,
    request_source VARCHAR(20),
    client_ip VARCHAR(50),
    device_type VARCHAR(50),
    query_complexity VARCHAR(20),
    result_count INT,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_query_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

# Stock Market
CREATE TABLE stock_master (
    stock_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    exchange VARCHAR(10),
    isin VARCHAR(20) UNIQUE,
    sector VARCHAR(50),
    industry VARCHAR(50),
    market_cap DECIMAL,
    listing_date DATE,
    face_value DECIMAL,
    lot_size INT,
    country VARCHAR(50),
    currency VARCHAR(10),
    trading_status VARCHAR(20),
    index_member BOOLEAN DEFAULT FALSE,
    last_traded_price DECIMAL,
    volume BIGINT,
    data_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


#Stock Fundamentals
CREATE TABLE stock_fundamentals (
    fundamentals_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL,
    pe_ratio DECIMAL,
    peg_ratio DECIMAL,
    pb_ratio DECIMAL,
    roe DECIMAL,
    roa DECIMAL,
    revenue DECIMAL,
    revenue_growth_yoy DECIMAL,
    ebitda DECIMAL,
    ebitda_growth_yoy DECIMAL,
    net_profit DECIMAL,
    eps DECIMAL,
    free_cash_flow DECIMAL,
    total_debt DECIMAL,
    debt_to_fcf_ratio DECIMAL,
    promoter_holding DECIMAL,
    public_holding DECIMAL,
    financial_year VARCHAR(10),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fundamentals_stock
        FOREIGN KEY (stock_id)
        REFERENCES stock_master(stock_id)
);

# Screener Results
CREATE TABLE screener_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL,
    stock_id UUID NOT NULL,
    current_price DECIMAL,
    target_price DECIMAL,
    upside_percent DECIMAL,
    screener_score INT,
    result_rank INT,
    earnings_beat_probability DECIMAL,
    buyback_announced BOOLEAN,
    dividend_yield DECIMAL,
    volatility DECIMAL,
    trend_indicator VARCHAR(20),
    confidence_level VARCHAR(20),
    risk_category VARCHAR(20),
    recommendation VARCHAR(20),
    notes TEXT,
    is_favorited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_result_query
        FOREIGN KEY (query_id)
        REFERENCES query_request(query_id),

    CONSTRAINT fk_result_stock
        FOREIGN KEY (stock_id)
        REFERENCES stock_master(stock_id)
);

# Alerts table
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    stock_id UUID NOT NULL,
    alert_type VARCHAR(50),
    alert_condition TEXT,
    threshold_value DECIMAL,
    comparison_operator VARCHAR(10),
    current_value DECIMAL,
    alert_status VARCHAR(20),
    trigger_count INT DEFAULT 0,
    last_triggered TIMESTAMP,
    notification_type VARCHAR(20),
    priority VARCHAR(20),
    expiry_date DATE,
    auto_disable BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_flag BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_alert_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_alert_stock
        FOREIGN KEY (stock_id)
        REFERENCES stock_master(stock_id)
);

