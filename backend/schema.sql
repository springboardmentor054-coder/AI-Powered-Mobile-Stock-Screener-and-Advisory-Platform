-- Drop existing tables
DROP TABLE IF EXISTS quarterly_financials CASCADE;
DROP TABLE IF EXISTS fundamentals CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table (what the code expects)
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  sector VARCHAR(100),
  exchange VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_symbol ON companies(symbol);
CREATE INDEX idx_companies_sector ON companies(sector);

-- Create fundamentals table
CREATE TABLE fundamentals (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  pe_ratio DECIMAL(10, 2),
  peg_ratio DECIMAL(10, 2),
  debt_to_fcf DECIMAL(10, 2),
  revenue_growth DECIMAL(10, 2),
  market_cap BIGINT,
  eps DECIMAL(10, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol)
);

CREATE INDEX idx_fundamentals_symbol ON fundamentals(symbol);
CREATE INDEX idx_fundamentals_pe_ratio ON fundamentals(pe_ratio);
CREATE INDEX idx_fundamentals_market_cap ON fundamentals(market_cap);

-- Create quarterly_financials table
CREATE TABLE quarterly_financials (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(20) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  quarter DATE NOT NULL,
  revenue BIGINT,
  profit BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, quarter)
);

CREATE INDEX idx_quarterly_company ON quarterly_financials(company_id);
CREATE INDEX idx_quarterly_quarter ON quarterly_financials(quarter);

-- Insert sample IT companies
INSERT INTO companies (symbol, name, sector, exchange) VALUES
('TCS', 'Tata Consultancy Services', 'IT', 'NSE'),
('INFY', 'Infosys Limited', 'IT', 'NSE'),
('WIPRO', 'Wipro Limited', 'IT', 'NSE'),
('HCLTECH', 'HCL Technologies', 'IT', 'NSE'),
('TECHM', 'Tech Mahindra', 'IT', 'NSE');

-- Insert sample Finance companies
INSERT INTO companies (symbol, name, sector, exchange) VALUES
('HDFCBANK', 'HDFC Bank', 'Finance', 'NSE'),
('ICICIBANK', 'ICICI Bank', 'Finance', 'NSE'),
('SBIN', 'State Bank of India', 'Finance', 'NSE');

-- Insert fundamentals for IT stocks
INSERT INTO fundamentals (symbol, pe_ratio, peg_ratio, debt_to_fcf, revenue_growth, market_cap, eps) VALUES
('TCS', 28.5, 2.1, 0.05, 12.5, 1200000000000, 120.5),
('INFY', 26.8, 1.9, 0.08, 15.2, 650000000000, 65.2),
('WIPRO', 22.4, 1.8, 0.12, 8.5, 320000000000, 28.5),
('HCLTECH', 24.3, 2.0, 0.10, 11.8, 450000000000, 45.8),
('TECHM', 21.5, 1.7, 0.15, 9.2, 280000000000, 32.1);

-- Insert fundamentals for Finance stocks
INSERT INTO fundamentals (symbol, pe_ratio, peg_ratio, debt_to_fcf, revenue_growth, market_cap, eps) VALUES
('HDFCBANK', 18.5, 1.5, 0.25, 18.5, 850000000000, 82.3),
('ICICIBANK', 16.8, 1.4, 0.30, 16.2, 620000000000, 45.7),
('SBIN', 12.3, 1.2, 0.45, 10.5, 480000000000, 38.5);

-- Insert quarterly financials (last 4 quarters for each company)
INSERT INTO quarterly_financials (company_id, quarter, revenue, profit) VALUES
-- TCS
('TCS', '2025-12-31', 62000000000, 12000000000),
('TCS', '2025-09-30', 60000000000, 11500000000),
('TCS', '2025-06-30', 59000000000, 11200000000),
('TCS', '2025-03-31', 58000000000, 11000000000),
-- INFY
('INFY', '2025-12-31', 40000000000, 8000000000),
('INFY', '2025-09-30', 39000000000, 7800000000),
('INFY', '2025-06-30', 38000000000, 7500000000),
('INFY', '2025-03-31', 37000000000, 7200000000);

-- Verification queries
SELECT 'Companies:' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'Fundamentals:', COUNT(*) FROM fundamentals
UNION ALL
SELECT 'Quarterly Data:', COUNT(*) FROM quarterly_financials;

-- Show sample data
SELECT 
  c.symbol,
  c.name,
  c.sector,
  f.pe_ratio,
  f.peg_ratio,
  f.market_cap
FROM companies c
INNER JOIN fundamentals f ON c.symbol = f.symbol
ORDER BY f.market_cap DESC
LIMIT 5;
