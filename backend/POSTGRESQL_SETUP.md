# PostgreSQL Database Setup Guide

## 📋 Overview

This guide will help you set up PostgreSQL for the AI Stock Screener project and populate it with IT sector stock data.

---

## Step 1: Install PostgreSQL

### Windows Installation:

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the latest version (16.x recommended)
   - Run the installer

2. **During Installation:**
   - Set a password for the `postgres` user (remember this!)
   - Default port: `5432` (keep default)
   - Install pgAdmin 4 (recommended for GUI management)

3. **Verify Installation:**
   ```powershell
   psql --version
   ```
   
   If command not found, add PostgreSQL to PATH:
   - Search "Environment Variables" in Windows
   - Edit PATH, add: `C:\Program Files\PostgreSQL\16\bin`

---

## Step 2: Create Database

### Option A: Using pgAdmin (GUI)

1. Open pgAdmin 4
2. Connect to PostgreSQL (localhost)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `stock_screener`
5. Click "Save"

### Option B: Using Command Line

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE stock_screener;

# Connect to the database
\c stock_screener

# Verify
\l
```

---

## Step 3: Run Schema SQL

### Option A: Using pgAdmin

1. In pgAdmin, select `stock_screener` database
2. Click "Query Tool" (top toolbar)
3. Open file: `schema.sql` from project root
4. Click "Execute" (▶️ button)
5. Verify tables created: Expand `stock_screener` → `Schemas` → `public` → `Tables`

### Option B: Using Command Line

```powershell
# Navigate to project root
cd "c:\Users\vinee\OneDrive\Desktop\AI-Powered-Mobile-Stock-Screener-and-Advisory-Platform"

# Run schema file
psql -U postgres -d stock_screener -f schema.sql
```

### Verify Tables Created:

```sql
-- Connect to database
psql -U postgres -d stock_screener

-- List all tables
\dt

-- Should see:
-- stocks
-- fundamentals
-- financials
-- corporate_actions
-- earnings_analyst_data
-- shareholding
```

---

## Step 4: Configure Backend .env

Update your `.env` file in the `backend` folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
```

**Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password!**

---

## Step 5: Test Database Connection

```powershell
cd backend
node -e "require('dotenv').config(); require('./config/database').testConnection().then(() => process.exit(0))"
```

**Expected output:**
```
✓ Connected to PostgreSQL database
Database connection test successful: { current_time: ... }
```

---

## Step 6: Populate Database

### ⚠️ Important Notes:

- **Rate Limits:** Alpha Vantage free tier = 25 requests/day, 5 requests/minute
- **Time Required:** Each stock takes ~1.5 minutes to process
- **Recommendation:** Start with 3-5 stocks for testing

### Option 1: Populate 3 Stocks (Testing)

```powershell
cd backend
node scripts/runPopulation.js --limit=3
```

**Estimated time:** 5-7 minutes  
**API calls used:** 15 (3 stocks × 5 calls each)

### Option 2: Populate All Stocks (~30)

```powershell
cd backend
node scripts/runPopulation.js
```

**Estimated time:** 45-60 minutes  
**API calls used:** 150 calls (requires multiple days due to rate limits)

### What Gets Populated:

For each stock, the script fetches and inserts:
- ✅ Company overview (name, sector, industry)
- ✅ Fundamentals (PE ratio, PEG ratio)
- ✅ Balance sheet (total debt)
- ✅ Cash flow (free cash flow)
- ✅ Income statements (revenue, EBITDA)
- ✅ Quarterly financials with YoY growth
- ✅ Current stock price

---

## Step 7: Verify Data

### Check Database:

```sql
-- Connect to database
psql -U postgres -d stock_screener

-- Count stocks
SELECT COUNT(*) FROM stocks;

-- View sample data
SELECT symbol, company_name, sector, industry FROM stocks LIMIT 5;

-- Check fundamentals
SELECT symbol, pe_ratio, peg_ratio, debt_to_fcf_ratio FROM fundamentals LIMIT 5;

-- Check financials
SELECT symbol, period, revenue, ebitda, revenue_yoy_growth FROM financials LIMIT 10;
```

---

## Step 8: Enable Daily Updates (Optional)

To automatically update stock data daily:

1. Update `.env`:
   ```env
   ENABLE_SCHEDULER=true
   ```

2. Restart backend server:
   ```powershell
   cd backend
   node index.js
   ```

3. Scheduler will run daily at 6:00 AM

**Manual trigger:**
```powershell
curl -X POST http://localhost:5000/api/admin/trigger-update
```

---

## 🔧 Troubleshooting

### Error: "psql: command not found"
**Solution:** Add PostgreSQL to your PATH (see Step 1)

### Error: "database does not exist"
**Solution:** Create database first (see Step 2)

### Error: "password authentication failed"
**Solution:** Update `.env` with correct PostgreSQL password

### Error: "ECONNREFUSED"
**Solution:** Ensure PostgreSQL service is running:
```powershell
# Check service status
Get-Service postgresql*

# Start service if stopped
Start-Service postgresql-x64-16
```

### Error: "Rate limit exceeded"
**Solution:** 
- Wait 24 hours for daily limit reset
- Or use `--limit=3` to test with fewer stocks

### Error: "No data found for symbol"
**Solution:** 
- Some symbols may have limited data on Alpha Vantage
- The script will continue with other stocks

---

## 📊 Database Schema Summary

### Tables Created:

1. **stocks** - Company master data (symbol, name, sector)
2. **fundamentals** - PE ratio, PEG ratio, debt, cash flow
3. **financials** - Quarterly/yearly revenue and EBITDA
4. **corporate_actions** - Buybacks, dividends (manual entry needed)
5. **earnings_analyst_data** - Earnings dates, estimates (partial from Alpha Vantage)
6. **shareholding** - Promoter/institutional holdings (manual entry needed)

---

## 🚀 Next Steps

Once database is populated:

1. ✅ Test database queries
2. ✅ Update screener routes to use real database
3. ✅ Build complex screening queries
4. ✅ Integrate with mobile app
5. ✅ Add manual data for missing fields (shareholding, buybacks)

---

## 📝 Useful Commands

### Connect to Database:
```powershell
psql -U postgres -d stock_screener
```

### List Tables:
```sql
\dt
```

### Describe Table Structure:
```sql
\d stocks
\d fundamentals
```

### Exit psql:
```sql
\q
```

### Drop Database (⚠️ Deletes all data):
```sql
DROP DATABASE stock_screener;
```

### Backup Database:
```powershell
pg_dump -U postgres stock_screener > backup.sql
```

### Restore Database:
```powershell
psql -U postgres stock_screener < backup.sql
```

---

## ✅ Checklist

- [ ] PostgreSQL installed
- [ ] Database `stock_screener` created
- [ ] Schema tables created (6 tables)
- [ ] `.env` configured with database credentials
- [ ] Database connection tested successfully
- [ ] Initial data populated (at least 3-5 stocks)
- [ ] Data verified in database

---

Need help? Check the troubleshooting section or review server logs for detailed error messages.
