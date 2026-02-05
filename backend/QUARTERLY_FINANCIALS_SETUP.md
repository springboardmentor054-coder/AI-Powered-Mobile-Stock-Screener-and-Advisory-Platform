# Quarterly Financials Data Loading Guide

## Problem
The `quarterly_financials` table was created but remains empty because no script was populating it with data.

## Solution
A new script has been created to load quarterly financial data from Yahoo Finance.

## How to Use

### 1. Run the Loading Script

```bash
cd backend
node scripts/loadQuarterlyFinancials.js
```

This script will:
- Fetch all active stocks from the database
- Retrieve quarterly financial data from Yahoo Finance for each stock
- Populate the `quarterly_financials` table with:
  - Revenue
  - Net Income
  - Gross Profit
  - Operating Income
  - EBITDA
  - EPS
  - Gross Margin
  - Operating Margin
  - Net Margin

### 2. Expected Output

The script will show progress like:
```
[1/150] Processing MSFT...
  ✓ MSFT - Loaded 4 quarters
[2/150] Processing AAPL...
  ✓ AAPL - Loaded 4 quarters
...
```

### 3. Verify Data

After running the script, you can verify the data in PostgreSQL:

```sql
-- Check total records
SELECT COUNT(*) FROM quarterly_financials;

-- View sample data
SELECT s.symbol, qf.quarter, qf.revenue, qf.net_income, qf.gross_margin 
FROM quarterly_financials qf 
JOIN stocks s ON s.id = qf.company_id 
ORDER BY qf.quarter DESC 
LIMIT 10;

-- Check data for a specific stock
SELECT * FROM quarterly_financials qf
JOIN stocks s ON s.id = qf.company_id
WHERE s.symbol = 'MSFT'
ORDER BY qf.quarter DESC;
```

## What Was Added

### 1. New Script: `loadQuarterlyFinancials.js`
- Located at: `backend/scripts/loadQuarterlyFinancials.js`
- Fetches quarterly financial data for all active stocks
- Inserts data into the `quarterly_financials` table
- Handles duplicates (upserts on conflict)

### 2. New Function: `getQuarterlyFinancials()`
- Added to: `backend/services/yahooFinanceService.js`
- Fetches quarterly income statements from Yahoo Finance
- Calculates financial margins (gross, operating, net)
- Returns structured data ready for database insertion

## Data Source

- **Primary Source**: Yahoo Finance (via `yahoo-finance2` npm package)
- **Rate Limits**: None (reasonable use)
- **Cost**: Free
- **Data Coverage**: Last 4-8 quarters (depending on company)

## Maintenance

To update quarterly financial data (e.g., after new quarterly results):

```bash
cd backend
node scripts/loadQuarterlyFinancials.js
```

The script uses `ON CONFLICT` clause to update existing records, so it's safe to run multiple times.

## Troubleshooting

### No data for some stocks
Some stocks may not have quarterly financial data available in Yahoo Finance. The script will skip them and continue.

### API Errors
If you encounter API errors:
1. Check your internet connection
2. Wait a few minutes and try again
3. The script includes 1-second delays between requests to be polite

### Database Connection Errors
Make sure your PostgreSQL database is running and the `.env` file is configured correctly.

## Integration with Screener

Once the data is loaded, you can use time-based queries in your screener:

```sql
-- Find companies with consistent revenue growth
SELECT s.symbol, s.company_name
FROM stocks s
INNER JOIN quarterly_financials qf ON s.id = qf.company_id
WHERE qf.quarter >= '2024-01-01'
GROUP BY s.id, s.symbol, s.company_name
HAVING COUNT(qf.id) >= 4
  AND AVG(qf.revenue) > 1000000000
  AND MIN(qf.revenue) > 0
ORDER BY AVG(qf.revenue) DESC;
```

See [TIME_BASED_QUERIES_GUIDE.md](../TIME_BASED_QUERIES_GUIDE.md) for more examples.
