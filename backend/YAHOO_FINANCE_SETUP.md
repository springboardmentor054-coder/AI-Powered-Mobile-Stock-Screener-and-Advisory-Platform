# Yahoo Finance Integration Guide

## Overview
This project now uses **Yahoo Finance** (via `yahoo-finance2` npm package) to fetch earnings estimates and analyst data, complementing Alpha Vantage for fundamental data.

## Why Yahoo Finance?

### ✅ Advantages
- **100% FREE** - No API key required
- **No rate limits** - Reasonable use allowed
- **Complete earnings data** - Earnings dates, estimates, historical surprises
- **Analyst ratings** - Target prices, buy/sell/hold counts, consensus ratings
- **Reliable** - Used by thousands of projects

### Data Provided by Yahoo Finance
1. **Earnings Information**
   - Next earnings date
   - Estimated EPS
   - Expected revenue
   - Beat probability (calculated from historical performance)
   - Previous quarter EPS and surprise %

2. **Analyst Data**
   - Analyst count
   - Strong Buy / Buy / Hold / Sell / Strong Sell counts
   - Target price low and high
   - Consensus rating
   - Current price

## Installation

```bash
cd backend
npm install yahoo-finance2
```

## Usage

### Service File
Location: `backend/services/yahooFinanceService.js`

```javascript
const yahooFinanceService = require('./services/yahooFinanceService');

// Get comprehensive earnings and analyst data
const data = await yahooFinanceService.getComprehensiveEarningsAnalystData('AAPL');

console.log(data);
// {
//   symbol: 'AAPL',
//   earningsDate: 2026-02-05T00:00:00.000Z,
//   estimatedEps: 2.25,
//   expectedRevenue: 118000000000,
//   beatProbability: 75.5,
//   analystTargetPriceLow: 180,
//   analystTargetPriceHigh: 250,
//   currentPrice: 215.30,
//   previousEps: 2.18,
//   epsSurprise: 0.08,
//   epsSurprisePercentage: 3.67,
//   analystCount: 45,
//   strongBuyCount: 15,
//   buyCount: 20,
//   holdCount: 8,
//   sellCount: 2,
//   strongSellCount: 0,
//   consensusRating: 'Buy'
// }
```

### Available Functions

1. **getEarningsData(symbol)**
   - Returns earnings dates and estimates

2. **getAnalystData(symbol)**
   - Returns analyst ratings and target prices

3. **getComprehensiveEarningsAnalystData(symbol)**
   - Combines both earnings and analyst data (recommended)

4. **getCurrentPrice(symbol)**
   - Quick price lookup

## Integration with Database Population

The `populateDatabase.js` script now:
1. Fetches fundamental data from **Alpha Vantage** (company overview, financials, balance sheet, cash flow)
2. Fetches earnings & analyst data from **Yahoo Finance**
3. Combines and stores all data in PostgreSQL

## Database Schema

The `earnings_analyst_data` table now stores:
```sql
CREATE TABLE earnings_analyst_data (
    symbol VARCHAR(10) PRIMARY KEY,
    earnings_date DATE,
    estimated_eps FLOAT,
    expected_revenue NUMERIC,
    beat_probability FLOAT,
    analyst_target_price_low FLOAT,
    analyst_target_price_high FLOAT,
    current_price FLOAT,
    previous_eps FLOAT,
    eps_surprise FLOAT,
    eps_surprise_percentage FLOAT,
    previous_revenue NUMERIC,
    revenue_surprise NUMERIC,
    revenue_surprise_percentage FLOAT,
    analyst_count INTEGER,
    strong_buy_count INTEGER,
    buy_count INTEGER,
    hold_count INTEGER,
    sell_count INTEGER,
    strong_sell_count INTEGER,
    consensus_rating VARCHAR(20)
);
```

## Testing the Integration

### Test a Single Stock
```javascript
const yahooFinanceService = require('./services/yahooFinanceService');

async function testYahoo() {
  const data = await yahooFinanceService.getComprehensiveEarningsAnalystData('MSFT');
  console.log(data);
}

testYahoo();
```

### Populate Database
```bash
cd backend
node scripts/runPopulation.js
```

## Rate Limiting

While Yahoo Finance doesn't have official rate limits, be respectful:
- Current implementation uses 1-second delays between requests
- Avoid making thousands of requests per minute
- The service is free; don't abuse it

## Error Handling

The service includes comprehensive error handling:
- Returns null values for missing data instead of throwing errors
- Logs errors for debugging
- Gracefully handles API failures

## Comparison: Alpha Vantage vs Yahoo Finance

| Data Type | Alpha Vantage | Yahoo Finance |
|-----------|---------------|---------------|
| Company Overview | ✅ | ⚠️ Limited |
| Financial Statements | ✅ | ⚠️ Limited |
| Balance Sheet | ✅ | ⚠️ Limited |
| Cash Flow | ✅ | ⚠️ Limited |
| **Earnings Estimates** | ❌ | ✅ |
| **Analyst Ratings** | ❌ | ✅ |
| **Target Prices** | ❌ | ✅ |
| Rate Limit | 25/day, 5/min | None (reasonable use) |
| API Key | Required | Not required |

## Troubleshooting

### Issue: No earnings date
- **Cause**: Company hasn't announced next earnings
- **Solution**: Normal behavior, will populate when announced

### Issue: Null analyst data
- **Cause**: Stock not widely covered by analysts
- **Solution**: Normal for smaller companies

### Issue: Request timeout
- **Cause**: Network issues or Yahoo Finance temporarily down
- **Solution**: Retry after a few seconds

## Best Practices

1. **Use for US stocks** - Yahoo Finance works best with US-listed stocks
2. **Handle nulls** - Always check for null values in your queries
3. **Update regularly** - Run population script weekly to keep data fresh
4. **Combine sources** - Use Alpha Vantage for financials, Yahoo for earnings
5. **Cache data** - Store in database rather than making real-time calls

## Next Steps

To populate your database with real earnings and analyst data:

```bash
cd backend/scripts
node runPopulation.js
```

This will fetch and populate all stocks with complete earnings and analyst information!
