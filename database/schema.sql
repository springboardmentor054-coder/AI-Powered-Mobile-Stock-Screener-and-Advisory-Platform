CREATE TABLE IF NOT EXISTS stocks_fundamentals (
    symbol TEXT PRIMARY KEY,
    exchange TEXT NOT NULL,
    company_name TEXT,
    pe NUMERIC,
    market_cap BIGINT,
    sector TEXT
);
