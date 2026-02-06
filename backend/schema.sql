-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS condition_evaluations CASCADE;
DROP TABLE IF EXISTS saved_screeners CASCADE;
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS quarterly_financials CASCADE;
DROP TABLE IF EXISTS fundamentals CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  alert_preferences JSONB DEFAULT '{"enabled": true, "allowedTypes": [], "severityThreshold": "low"}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
 
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
-- ============================================
-- PORTFOLIO MANAGEMENT TABLES
-- ============================================

-- Watchlist table
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_watchlist_company ON watchlist(company_id);

-- Portfolio items (user holdings)
CREATE TABLE portfolio_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quantity DECIMAL(15, 4) NOT NULL CHECK (quantity > 0),
  avg_price DECIMAL(15, 2) NOT NULL CHECK (avg_price > 0),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_company ON portfolio_items(company_id);

-- ============================================
-- SAVED SCREENERS
-- ============================================

CREATE TABLE saved_screeners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dsl_query JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_screeners_user ON saved_screeners(user_id);
CREATE INDEX idx_saved_screeners_active ON saved_screeners(active) WHERE active = true;

-- ============================================
-- CONDITION EVALUATION ENGINE
-- ============================================

CREATE TABLE condition_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  evaluation_type VARCHAR(50) NOT NULL, -- 'portfolio', 'screener', 'watchlist'
  condition_key VARCHAR(100) NOT NULL, -- e.g., 'pe_ratio_below_20', 'revenue_growth_high'
  previous_state JSONB, -- Previous metrics snapshot
  current_state JSONB NOT NULL, -- Current metrics snapshot
  state_changed BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id, evaluation_type, condition_key)
);

CREATE INDEX idx_evaluations_user_company ON condition_evaluations(user_id, company_id);
CREATE INDEX idx_evaluations_changed ON condition_evaluations(state_changed) WHERE state_changed = true;
CREATE INDEX idx_evaluations_type ON condition_evaluations(evaluation_type);

-- ============================================
-- ALERT SYSTEM
-- ============================================

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'pe_change', 'revenue_growth', 'price_target', 'VALUATION', 'EVENT', 'PORTFOLIO', etc.
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  previous_value JSONB,
  current_value JSONB,
  metadata JSONB, -- Additional context
  active BOOLEAN DEFAULT true,
  read BOOLEAN DEFAULT false,
  delivered BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(active) WHERE active = true;
CREATE INDEX idx_alerts_unread ON alerts(user_id, read) WHERE read = false;
CREATE INDEX idx_alerts_acknowledged ON alerts(user_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at DESC);

-- ============================================
-- AUDIT LOGGING
-- ============================================

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'alert', 'portfolio', 'screener', 'evaluation'
  entity_id INTEGER,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'trigger', 'evaluate'
  description TEXT,
  metadata JSONB, -- Flexible JSON storage for additional data
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert demo user
INSERT INTO users (email, name) VALUES
('demo@stockscreener.com', 'Demo User'),
('investor@example.com', 'Active Investor');