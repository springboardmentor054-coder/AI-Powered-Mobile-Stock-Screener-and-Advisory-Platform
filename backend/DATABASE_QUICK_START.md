# 🚀 Quick Start Guide - Database Setup & Population

## ⚡ Fast Track (5 Minutes Setup)

### 1. Install PostgreSQL (If not installed)
Download: https://www.postgresql.org/download/windows/
- Set password for `postgres` user
- Keep default port: 5432

### 2. Create Database
```powershell
psql -U postgres
CREATE DATABASE stock_screener;
\q
```

### 3. Run Schema
```powershell
cd "c:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform"
psql -U postgres -d stock_screener -f schema.sql
```

### 4. Update .env
```env
DB_PASSWORD=your-postgres-password-here
```

### 5. Test Connection
```powershell
cd backend
node -e "require('dotenv').config(); require('./config/database').testConnection().then(() => process.exit(0))"
```

### 6. Populate with 3 Test Stocks (~5 minutes)
```powershell
node scripts/runPopulation.js --limit=3
```

---

## 📊 What's Been Created

### Services & Scripts:

1. **[services/stockDataService.js](services/stockDataService.js)**
   - `upsertStock()` - Insert/update stock master data
   - `upsertFundamentals()` - Insert/update PE, PEG, debt ratios
   - `insertFinancialPerformance()` - Insert quarterly/yearly financials
   - `upsertEarningsAnalystData()` - Insert earnings data
   - `getStocksBySector()` - Query stocks by sector
   - `getStockComplete()` - Get all data for a stock

2. **[scripts/populateDatabase.js](scripts/populateDatabase.js)**
   - List of 30 IT sector stocks (Software, Semiconductors, Hardware, Telecom)
   - `populateStockData()` - Fetch and insert data for one stock
   - `populateAllStocks()` - Populate entire database
   - `updateExistingStocks()` - Update existing stock data

3. **[scripts/runPopulation.js](scripts/runPopulation.js)**
   - Main script to run population
   - Database connection test
   - Progress tracking
   - Error handling

4. **[scripts/scheduler.js](scripts/scheduler.js)**
   - Daily auto-update at 6:00 AM
   - Manual trigger endpoint
   - Cron job configuration

5. **[routes/databaseTest.js](routes/databaseTest.js)**
   - Test database connection
   - Insert sample data
   - Query stocks by sector
   - Get database statistics

---

## 🧪 Testing Endpoints

Once your database is set up, test these endpoints:

### Test Database Connection:
```
GET http://localhost:5000/api/db-test/connection
```

### Get Database Statistics:
```
GET http://localhost:5000/api/db-test/stats
```

### Insert Sample Data:
```
POST http://localhost:5000/api/db-test/insert-sample
```

### Get All Stocks:
```
GET http://localhost:5000/api/db-test/stocks
```

### Get Stocks by Sector:
```
GET http://localhost:5000/api/db-test/sector/Technology
```

### Get Complete Stock Data:
```
GET http://localhost:5000/api/db-test/stock/MSFT
```

---

## 📋 IT Sector Stocks (30 Total)

### Software (10):
MSFT, ORCL, CRM, ADBE, NOW, INTU, WDAY, PANW, SNOW, DDOG

### Semiconductors (10):
NVDA, AMD, INTC, QCOM, AVGO, TXN, MU, AMAT, LRCX, KLAC

### Hardware (5):
AAPL, HPQ, DELL, WDC, STX

### Networking & Telecom (5):
CSCO, ANET, JNPR, T, VZ

---

## ⏱️ Time Estimates

| Task | Time | API Calls |
|------|------|-----------|
| 1 Stock | ~1.5 min | 5 calls |
| 3 Stocks | ~5 min | 15 calls |
| 5 Stocks | ~8 min | 25 calls (daily limit) |
| 30 Stocks | ~45 min | 150 calls (6 days needed) |

---

## 🔄 Daily Updates

### Enable Auto-Updates:
```env
ENABLE_SCHEDULER=true
```

Scheduler runs daily at 6:00 AM and updates all existing stocks.

### Manual Update Trigger:
```powershell
curl -X POST http://localhost:5000/api/admin/trigger-update
```

---

## ✅ Verification Checklist

After setup, verify:

```sql
-- Connect to database
psql -U postgres -d stock_screener

-- Check table counts
SELECT 'stocks' as table_name, COUNT(*) FROM stocks
UNION ALL
SELECT 'fundamentals', COUNT(*) FROM fundamentals
UNION ALL
SELECT 'financials', COUNT(*) FROM financials;

-- View sample stock
SELECT s.symbol, s.company_name, s.sector,
       f.pe_ratio, f.peg_ratio, f.debt_to_fcf_ratio
FROM stocks s
JOIN fundamentals f ON s.symbol = f.symbol
LIMIT 5;
```

Expected output (after populating 3 stocks):
- stocks: 3
- fundamentals: 3
- financials: ~24 (8 quarters × 3 stocks)

---

## 🎯 What's Next?

After database is populated:

1. **Update Screener** - Connect screener routes to real database
2. **Build Query Engine** - Execute complex screening queries
3. **Add Filters** - Implement all screening criteria
4. **Connect Mobile App** - Integrate frontend with backend
5. **Add Missing Data** - Manual entry for shareholding, buybacks

---

## 📞 Need Help?

### Common Issues:

**"psql: command not found"**
- Add PostgreSQL to PATH

**"password authentication failed"**
- Update `.env` with correct password

**"Rate limit exceeded"**
- Wait 24 hours or use `--limit=3`

**"Database connection failed"**
- Ensure PostgreSQL service is running

### Check Logs:
```powershell
# View population logs
node scripts/runPopulation.js --limit=1

# View server logs
cd backend
node index.js
```

---

## 🎉 Success Indicators

You're ready when you see:

✅ Database connection test successful
✅ Schema tables created (6 tables)
✅ At least 3 stocks populated
✅ Fundamentals data present
✅ Financial records inserted
✅ API test endpoints responding

---

For detailed setup instructions, see: [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
