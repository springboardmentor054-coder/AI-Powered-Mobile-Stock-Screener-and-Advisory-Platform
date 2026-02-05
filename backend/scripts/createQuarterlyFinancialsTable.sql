-- Create quarterly_financials table for time-based queries
-- This table stores quarterly financial data for each company

-- Drop the table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS quarterly_financials;

CREATE TABLE quarterly_financials (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    quarter DATE NOT NULL,
    revenue NUMERIC,
    net_income NUMERIC,
    gross_profit NUMERIC,
    operating_income NUMERIC,
    ebitda NUMERIC,
    eps FLOAT,
    gross_margin FLOAT,
    operating_margin FLOAT,
    net_margin FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, quarter)
);

-- Create indexes for efficient time-based queries
CREATE INDEX idx_quarterly_financials_symbol ON quarterly_financials(symbol);
CREATE INDEX idx_quarterly_financials_quarter ON quarterly_financials(quarter DESC);
CREATE INDEX idx_quarterly_financials_symbol_quarter ON quarterly_financials(symbol, quarter DESC);

-- Sample data to demonstrate time-based queries
-- Insert sample quarterly data for testing (optional)
-- Uncomment the lines below to populate with sample data

/*
INSERT INTO quarterly_financials (symbol, quarter, revenue, net_income, gross_profit, operating_income) VALUES
('MSFT', '2024-01-01', 5000000, 500000, 2000000, 800000),
('MSFT', '2024-04-01', 5200000, 520000, 2100000, 850000),
('MSFT', '2024-07-01', 5400000, 540000, 2200000, 900000),
('MSFT', '2024-10-01', 5600000, 560000, 2300000, 950000),
('AAPL', '2024-01-01', 3000000, -100000, 1200000, 400000),
('AAPL', '2024-04-01', 3200000, 150000, 1300000, 450000),
('AAPL', '2024-07-01', 3400000, 200000, 1400000, 500000),
('AAPL', '2024-10-01', 3600000, 250000, 1500000, 550000);
*/

COMMENT ON TABLE quarterly_financials IS 'Stores quarterly financial data for time-based analysis and GROUP BY queries';
COMMENT ON COLUMN quarterly_financials.symbol IS 'Stock symbol - links to stocks.symbol';
COMMENT ON COLUMN quarterly_financials.quarter IS 'Quarter start date (e.g., 2024-01-01 for Q1 2024)';
COMMENT ON COLUMN quarterly_financials.revenue IS 'Total revenue for the quarter';
COMMENT ON COLUMN quarterly_financials.net_income IS 'Net income/profit for the quarter';
