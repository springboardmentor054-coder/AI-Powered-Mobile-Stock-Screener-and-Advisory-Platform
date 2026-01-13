# Alpha Vantage API Integration - Testing Guide

## ✅ Setup Complete

The following components have been successfully integrated:

1. **Environment Configuration** (`.env`)
   - Alpha Vantage API Key: `1E1M5U84QO50L7FK`
   - PostgreSQL database configuration
   - JWT authentication secret

2. **Alpha Vantage Service** (`services/alphaVantageService.js`)
   - Company overview (sector, PE ratio, PEG ratio)
   - Income statements (revenue, EBITDA)
   - Balance sheet (total debt)
   - Cash flow (free cash flow)
   - Earnings data and calendar
   - Real-time stock quotes
   - Built-in rate limiting (5 req/min, 25 req/day)

3. **Database Configuration** (`config/database.js`)
   - PostgreSQL connection pool
   - Query execution helpers

4. **Test Endpoints** (`routes/alphaVantageTest.js`)
   - Multiple endpoints to test API functionality

## 🚀 How to Test

### Step 1: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
Server running on port 5000
Alpha Vantage API Key: ✓ Loaded
Database: stock_screener
```

### Step 2: Test API Endpoints

Use your browser or Postman to test these endpoints:

#### Test 1: Get Company Overview (Fundamentals)
```
GET http://localhost:5000/api/test/overview/MSFT
```

**What it returns:**
- Company name, sector, industry
- PE ratio, PEG ratio
- Market cap, EPS, profit margins
- 52-week high/low

#### Test 2: Get Current Stock Quote
```
GET http://localhost:5000/api/test/quote/AAPL
```

**What it returns:**
- Current price
- Daily change and change %
- Volume, open, high, low
- Previous close

#### Test 3: Get Income Statement
```
GET http://localhost:5000/api/test/income/GOOGL
```

**What it returns:**
- Quarterly and annual revenue
- EBITDA
- Net income
- Operating income

#### Test 4: Get Earnings Calendar
```
GET http://localhost:5000/api/test/earnings-calendar
```

**What it returns:**
- Upcoming earnings dates (next 3 months)
- Company names and estimated EPS

#### Test 5: For IT Sector Companies

Try these symbols:
- `MSFT` - Microsoft (Software)
- `NVDA` - NVIDIA (Semiconductors)
- `AAPL` - Apple (Hardware)
- `CSCO` - Cisco (Networking)
- `INTC` - Intel (Semiconductors)
- `AMD` - AMD (Semiconductors)
- `ORCL` - Oracle (Software)
- `CRM` - Salesforce (Software)

## ⚠️ Important Notes

### Rate Limits
- **Free Tier**: 25 requests per day, 5 requests per minute
- The service automatically tracks and enforces these limits
- If you exceed limits, you'll get an error message

### Alpha Vantage Limitations
Alpha Vantage provides excellent financial data, but it **does NOT include**:
- Shareholding patterns (promoter holding %)
- Stock buyback announcements
- Analyst price targets

**For these fields, you'll need:**
- NSE/BSE APIs for Indian stock data (shareholding, buybacks)
- Yahoo Finance API for analyst targets
- Manual data entry for buyback announcements

### Testing Indian IT Companies (NSE)

Alpha Vantage supports NSE stocks with `.BSE` or `.NS` suffix:
```
GET http://localhost:5000/api/test/overview/INFY.NS
GET http://localhost:5000/api/test/overview/TCS.NS
GET http://localhost:5000/api/test/overview/WIPRO.NS
```

However, data availability may be limited for Indian stocks. For production, consider:
- NSE Official API
- BSE API
- Third-party Indian market data providers

## 📝 Example Response

### Company Overview for MSFT:
```json
{
  "success": true,
  "data": {
    "symbol": "MSFT",
    "companyName": "Microsoft Corporation",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "industry": "Software - Infrastructure",
    "peRatio": 35.5,
    "pegRatio": 2.1,
    "marketCap": 2800000000000,
    "eps": 9.72,
    "revenueTTM": 211915000000
  }
}
```

## 🔧 Troubleshooting

### Error: "Rate limit exceeded"
- Wait 1 minute (for per-minute limit)
- Wait 24 hours (for daily limit)
- Consider upgrading to Alpha Vantage premium plan

### Error: "No response from Alpha Vantage API"
- Check your internet connection
- Verify API key in `.env` file
- Check Alpha Vantage service status

### Error: "No data found for symbol"
- Verify the stock symbol is correct
- Some international stocks may have limited data
- Try adding exchange suffix (.NS, .BSE, .L, etc.)

## 📦 Next Steps

Now that Alpha Vantage is integrated, the next priorities are:

1. **Create Data Population Scripts** (Step 2)
   - Script to fetch IT sector stocks
   - Populate database with stock data
   - Schedule daily updates

2. **Build Database Layer** (Step 3)
   - Functions to insert/update stock data
   - Validate data before insertion
   - Handle duplicates and updates

3. **Enhance Screener** (Step 4)
   - Connect screener to real database
   - Execute SQL queries
   - Return filtered results

4. **Add Missing Data Sources** (Step 5)
   - Integrate NSE/BSE API for Indian stocks
   - Add Yahoo Finance for analyst targets
   - Manual buyback tracking

## 🎯 Current Status

✅ Alpha Vantage API integrated and working
✅ Environment configuration complete
✅ Database connection ready
✅ Test endpoints available

⏳ Next: Data population scripts
⏳ Next: Database insertion logic
⏳ Next: Real screener implementation
