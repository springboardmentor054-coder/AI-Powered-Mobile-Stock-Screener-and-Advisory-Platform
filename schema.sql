CREATE TABLE IF NOT EXISTS stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  symbol TEXT,
  sector TEXT,
  pe_ratio REAL,
  market_cap TEXT
);

INSERT INTO stocks (name, symbol, sector, pe_ratio, market_cap) VALUES
('Infosys', 'INFY', 'IT', 9.2, 'Large Cap'),
('TCS', 'TCS', 'IT', 8.7, 'Large Cap'),
('Wipro', 'WIPRO', 'IT', 12.4, 'Large Cap'),
('HCL Technologies', 'HCLTECH', 'IT', 10.1, 'Large Cap'),
('Tech Mahindra', 'TECHM', 'IT', 11.3, 'Large Cap'),
('Reliance Industries', 'RELIANCE', 'Energy', 22.1, 'Large Cap'),
('HDFC Bank', 'HDFCBANK', 'Banking', 18.6, 'Large Cap'),
('ICICI Bank', 'ICICIBANK', 'Banking', 17.9, 'Large Cap'),
('Tata Motors', 'TATAMOTORS', 'Auto', 14.2, 'Large Cap'),
('Maruti Suzuki', 'MARUTI', 'Auto', 21.5, 'Large Cap');

CREATE TABLE IF NOT EXISTS companies (
  company_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  symbol TEXT UNIQUE,
  sector TEXT,
  industry TEXT
);
INSERT INTO companies (name, symbol, sector, industry) VALUES
('Infosys', 'INFY', 'IT', 'Software Services'),
('TCS', 'TCS', 'IT', 'IT Consulting'),
('HDFC Bank', 'HDFCBANK', 'Banking', 'Private Bank'),
('Reliance Industries', 'RELIANCE', 'Energy', 'Conglomerate');

CREATE TABLE IF NOT EXISTS financials (
  financial_id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT,
  pe_ratio REAL,
  eps REAL,
  roe REAL,
  debt_equity REAL,
  FOREIGN KEY(symbol) REFERENCES companies(symbol)
);
INSERT INTO financials (symbol, pe_ratio, eps, roe, debt_equity) VALUES
('INFY', 9.2, 52.3, 27.1, 0.1),
('TCS', 8.7, 61.4, 31.2, 0.0),
('HDFCBANK', 18.6, 75.2, 16.5, 1.2),
('RELIANCE', 22.1, 45.7, 9.4, 0.8);

