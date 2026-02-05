# 📈 Historical Price Data - Setup Guide

## Overview
Your database now supports storing and tracking historical stock prices over time! You can see how stocks changed over days, weeks, or months.

## What Was Added

### 1. Database Table: `price_history`
Stores daily OHLCV data:
- **Date**: Trading date
- **Open, High, Low, Close**: Daily prices
- **Volume**: Trading volume
- **Adjusted Close**: Price adjusted for splits/dividends

### 2. New API Endpoints

#### Get Historical Data
```bash
GET /api/prices/:symbol/history?days=30
GET /api/prices/:symbol/history?startDate=2025-01-01&endDate=2026-02-01
```

**Example Response:**
```json
{
  "success": true,
  "symbol": "RELIANCE",
  "count": 30,
  "data": [
    {
      "symbol": "RELIANCE",
      "date": "2026-02-01",
      "open": 2850.50,
      "high": 2875.25,
      "low": 2840.00,
      "close": 2865.75,
      "volume": 12500000,
      "adjusted_close": 2865.75
    }
  ]
}
```

#### Get Latest Price
```bash
GET /api/prices/:symbol/latest
```

#### Get Price Statistics
```bash
GET /api/prices/:symbol/stats?days=30
```

**Example Response:**
```json
{
  "symbol": "RELIANCE",
  "period": "30 days",
  "stats": {
    "high": 2900.00,
    "low": 2700.00,
    "current_price": 2865.75,
    "start_price": 2750.00,
    "change": 115.75,
    "change_percent": "4.21"
  }
}
```

#### Get Chart Data
```bash
GET /api/prices/:symbol/chart?days=30
```

## 🚀 Setup Instructions

### Step 1: Create the Database Table
```bash
cd backend
node scripts/createPriceHistoryTable.js
```

This will:
- Create the `price_history` table
- Add indexes for fast queries
- Show the table structure

### Step 2: Load Historical Data

#### Load All Stocks (Last 90 Days)
```bash
node scripts/loadHistoricalPrices.js
```

This will fetch and store the last 90 days of price data for all active stocks in your database.

**Expected time:** ~5-10 minutes for 50 stocks (with 2-second delays)

#### Load Specific Stock
```bash
node scripts/loadHistoricalPrices.js RELIANCE 30
```

This loads the last 30 days for RELIANCE stock.

### Step 3: Test the API

Start your backend server:
```bash
npm start
```

Test the endpoints:
```bash
# Get 30 days of data for RELIANCE
curl http://localhost:5000/api/prices/RELIANCE/history?days=30

# Get latest price
curl http://localhost:5000/api/prices/RELIANCE/latest

# Get price statistics
curl http://localhost:5000/api/prices/RELIANCE/stats?days=30

# Get chart data
curl http://localhost:5000/api/prices/RELIANCE/chart?days=7
```

## 📊 Usage Examples

### Query Price Changes
```sql
-- Get stocks that increased more than 5% in last 30 days
WITH price_changes AS (
  SELECT 
    symbol,
    (SELECT close FROM price_history p2 
     WHERE p2.symbol = p1.symbol 
     ORDER BY date DESC LIMIT 1) as current_price,
    (SELECT close FROM price_history p2 
     WHERE p2.symbol = p1.symbol 
     ORDER BY date ASC LIMIT 1) as old_price
  FROM price_history p1
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY symbol
)
SELECT 
  symbol,
  current_price,
  old_price,
  ((current_price - old_price) / old_price * 100) as change_percent
FROM price_changes
WHERE ((current_price - old_price) / old_price * 100) > 5
ORDER BY change_percent DESC;
```

### Find 52-Week High/Low
```sql
SELECT 
  symbol,
  MAX(high) as week_52_high,
  MIN(low) as week_52_low,
  (SELECT close FROM price_history p2 
   WHERE p2.symbol = p1.symbol 
   ORDER BY date DESC LIMIT 1) as current_price
FROM price_history p1
WHERE date >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY symbol;
```

## 🔄 Keeping Data Updated

### Option 1: Manual Updates
Run the load script periodically:
```bash
node scripts/loadHistoricalPrices.js
```

### Option 2: Add to Scheduler
Update `backend/scripts/scheduler.js` to include historical data updates:

```javascript
// Add to the dailyUpdate function
const { updateStockHistory } = require('./loadHistoricalPrices');

async function dailyUpdate() {
  // ... existing code ...
  
  // Update price history (last 7 days)
  console.log('\n📈 Updating price history...');
  await loadHistoricalPrices(7); // Update last week
}
```

## 📱 Frontend Integration

### Example: Display Price Chart
```dart
// In your Flutter app
Future<List<PriceData>> getPriceHistory(String symbol, int days) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/prices/$symbol/history?days=$days'),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List)
        .map((item) => PriceData.fromJson(item))
        .toList();
  }
  throw Exception('Failed to load price history');
}
```

### Example: Show Price Stats
```dart
Future<PriceStats> getPriceStats(String symbol, int days) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/prices/$symbol/stats?days=$days'),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return PriceStats.fromJson(data['stats']);
  }
  throw Exception('Failed to load price stats');
}
```

## 📝 Notes

- **Data Source**: Yahoo Finance (free, unlimited)
- **Delay**: 2-second delay between requests to be respectful
- **Storage**: ~1KB per day per stock (very efficient)
- **90 days for 50 stocks**: ~4.5MB of data
- **Indexes**: Optimized for date range queries

## 🎯 What You Can Now Do

1. ✅ Track daily price changes
2. ✅ Calculate percentage gains/losses
3. ✅ Show price charts in your app
4. ✅ Identify trends (uptrend, downtrend)
5. ✅ Calculate moving averages
6. ✅ Find stocks at 52-week highs/lows
7. ✅ Compare performance over time
8. ✅ Technical analysis (RSI, MACD, etc.)

## 🚨 Important

- Run the `createPriceHistoryTable.js` script FIRST
- Then run `loadHistoricalPrices.js` to populate data
- The more historical data you load, the better analysis you can do
- Consider loading 90+ days for meaningful trends

## Need Help?

Check the logs while running the scripts - they're very verbose and show progress!
