# Wishlist Daily Change Tracking

This feature allows users to track how their wishlisted stocks change from day to day.

## Overview

When users add stocks to their wishlist, the system captures daily snapshots of key metrics including:
- Price data (current, open, high, low, volume)
- Fundamental data (PE ratio, PB ratio, EPS, dividend yield, market cap)
- Daily changes (price change, price change %, volume change %)

## Database Setup

### 1. Create the Wishlist History Table

```bash
node backend/scripts/createWishlistHistoryTable.js
```

This creates the `wishlist_history` table that stores daily snapshots of wishlisted stocks.

## Daily Update Process

The wishlist tracking system works in two steps:

### Step 1: Update All Stocks (Daily)
```bash
node backend/scripts/updateAllStocks.js
```
This updates all stock data in the database with the latest information from Yahoo Finance.

### Step 2: Capture Wishlist Snapshots (After Stock Updates)
```bash
node backend/scripts/captureWishlistSnapshots.js
```
This captures snapshots of all wishlisted stocks with:
- Current prices and volume
- Fundamental metrics
- Calculated changes from previous day

**Important:** Run `captureWishlistSnapshots.js` AFTER `updateAllStocks.js` completes to capture the updated data.

## Automation with Scheduler

To automate the daily update process, update your scheduler to run both scripts:

```javascript
// In backend/scripts/scheduler.js

// Run daily at 6 PM (after market close)
cron.schedule('0 18 * * *', async () => {
  console.log('Starting daily update at', new Date().toLocaleString());
  
  // Step 1: Update all stocks
  await updateAllStocks();
  
  // Step 2: Capture wishlist snapshots
  await captureWishlistSnapshots();
}, {
  timezone: "America/New_York"
});
```

## API Endpoints

### 1. Get Wishlist with Daily Changes
```
GET /api/wishlist
Authorization: Bearer <token>
```

**Response includes:**
- Current stock data
- Today's snapshot data (open, high, low, volume)
- Yesterday's comparison data (previous price, volume, PE ratio, market cap)
- Calculated changes (price_change, price_change_percentage, volume_change_percentage)

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "wishlist": [
    {
      "wishlist_id": 1,
      "symbol": "AAPL",
      "company_name": "Apple Inc.",
      "sector": "Technology",
      "current_price": 178.50,
      "today_open": 177.20,
      "today_high": 179.80,
      "today_low": 176.90,
      "today_volume": 52341000,
      "price_change": 2.30,
      "price_change_percentage": "1.31",
      "volume_change_percentage": "12.45",
      "yesterday_price": 176.20,
      "yesterday_volume": 46523000,
      "yesterday_pe_ratio": 28.5,
      "yesterday_date": "2026-02-03"
    }
  ]
}
```

### 2. Get Historical Data for a Stock
```
GET /api/wishlist/history/:symbol?days=30
Authorization: Bearer <token>
```

**Parameters:**
- `symbol`: Stock symbol (required)
- `days`: Number of days of history (default: 30)

**Example Response:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "count": 30,
  "history": [
    {
      "snapshot_date": "2026-02-04",
      "current_price": 178.50,
      "open_price": 177.20,
      "high_price": 179.80,
      "low_price": 176.90,
      "volume": 52341000,
      "pe_ratio": 28.8,
      "market_cap": 2800000000000,
      "price_change": 2.30,
      "price_change_percentage": "1.31",
      "volume_change_percentage": "12.45"
    },
    {
      "snapshot_date": "2026-02-03",
      "current_price": 176.20,
      "volume": 46523000,
      ...
    }
  ]
}
```

## Frontend Integration

### Display Daily Changes in Wishlist

In your Flutter app, you can display the daily changes:

```dart
// In your wishlist screen
ListView.builder(
  itemCount: wishlist.length,
  itemBuilder: (context, index) {
    final stock = wishlist[index];
    final priceChange = stock['price_change'];
    final priceChangePct = stock['price_change_percentage'];
    final isPositive = priceChange != null && priceChange > 0;
    
    return Card(
      child: ListTile(
        title: Text(stock['company_name']),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('₹${stock['current_price']}'),
            Row(
              children: [
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  color: isPositive ? Colors.green : Colors.red,
                  size: 16,
                ),
                Text(
                  '${priceChange?.toStringAsFixed(2)} (${priceChangePct}%)',
                  style: TextStyle(
                    color: isPositive ? Colors.green : Colors.red,
                  ),
                ),
                Text(' vs yesterday'),
              ],
            ),
          ],
        ),
      ),
    );
  },
);
```

### Show Historical Chart

Use the `/api/wishlist/history/:symbol` endpoint to fetch historical data and display it in a chart:

```dart
// Fetch last 30 days of history
final response = await http.get(
  Uri.parse('$baseUrl/api/wishlist/history/$symbol?days=30'),
  headers: {'Authorization': 'Bearer $token'},
);

final history = jsonDecode(response.body)['history'];

// Use a charting library like fl_chart to display the data
LineChart(
  LineChartData(
    spots: history.map((day) => FlSpot(
      parseDate(day['snapshot_date']),
      day['current_price'],
    )).toList(),
  ),
);
```

## Data Retention

Consider implementing data retention policies:

```sql
-- Delete snapshots older than 1 year (run monthly)
DELETE FROM wishlist_history 
WHERE snapshot_date < CURRENT_DATE - INTERVAL '1 year';
```

## Benefits

1. **Track Performance**: Users can see how their wishlisted stocks are performing over time
2. **Daily Insights**: Show percentage changes from previous day
3. **Historical Analysis**: View trends over weeks/months
4. **Volume Changes**: Identify unusual trading activity
5. **Better Decisions**: Make informed decisions based on historical data

## Troubleshooting

### No yesterday data showing
- Make sure you've run `captureWishlistSnapshots.js` at least twice (need two days of data)
- Check that the script is running daily after `updateAllStocks.js`

### Missing snapshot data
- Verify the stock exists in the user's wishlist
- Check that `updateAllStocks.js` successfully updated the stock data
- Review logs from `captureWishlistSnapshots.js` for errors

### Performance issues
- The queries use indexes on user_id, symbol, and snapshot_date
- Consider adding pagination if users have many wishlisted stocks
- Implement caching for frequently accessed historical data
