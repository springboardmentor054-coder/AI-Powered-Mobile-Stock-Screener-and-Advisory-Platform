# 🔔 Wishlist Alert System

A comprehensive notification system that monitors your wishlist stocks and alerts you when significant changes occur.

## ✨ Features

### 📊 Real-time Monitoring
The alert system continuously monitors your wishlist stocks and detects:
- **Price Changes** (±5% threshold)
- **P/E Ratio Changes** (±15% threshold)
- **Volume Spikes** (50%+ increase)
- **Dividend Yield Changes** (±20% threshold)

### 🎯 Alert Types

1. **Price Increase** 🔺
   - Triggered when stock price increases by 5% or more
   - **Critical** severity if change is 10%+
   - **Warning** severity if change is 5-10%

2. **Price Decrease** 🔻
   - Triggered when stock price decreases by 5% or more
   - Helps you monitor potential risks

3. **Volume Spike** 📈
   - Triggered when trading volume increases by 50%+
   - Indicates significant market interest

4. **P/E Ratio Changes** 📊
   - Monitors valuation changes
   - Helps identify buying/selling opportunities

5. **Dividend Changes** 💰
   - Tracks dividend yield changes
   - Important for income-focused investors

### 🔔 Alert Severity Levels

- **Critical** 🔴 (Red): Urgent attention needed (10%+ price changes)
- **Warning** 🟠 (Orange): Important changes (5-10% changes)
- **Info** 🔵 (Blue): Informational updates

## 🚀 How to Use

### 1. Bell Icon on Home Screen
- Located in the top-right corner of the home screen
- Shows **red badge** with unread alert count
- Tap to view all alerts

### 2. Alerts Screen
- **All Tab**: View all alerts (read and unread)
- **Unread Tab**: View only unread alerts
- **Swipe Actions**:
  - Swipe **right** ➡️: Mark as read
  - Swipe **left** ⬅️: Delete alert

### 3. Alert Details
- Tap any alert to view full details
- See old vs new values
- View percentage change
- Understand the reason for the alert

### 4. Alert Management
- **Mark All as Read**: Menu → Mark all as read
- **Delete All**: Menu → Delete all (requires confirmation)
- **Individual Actions**: Swipe on any alert

## ⚙️ Backend API Endpoints

```
GET    /api/alerts                  - Get all alerts
GET    /api/alerts/unread-count     - Get unread count
PUT    /api/alerts/:id/read         - Mark alert as read
PUT    /api/alerts/mark-all-read    - Mark all as read
DELETE /api/alerts/:id              - Delete specific alert
DELETE /api/alerts                  - Delete all alerts
POST   /api/alerts/generate         - Manually trigger alert generation
POST   /api/alerts/test             - Create test alert (development)
```

## 🗄️ Database Schema

```sql
CREATE TABLE wishlist_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  symbol VARCHAR(10) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  change_percentage NUMERIC,
  severity VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);
```

## 🔄 Automatic Alert Generation

Alerts are generated automatically when:

### Daily Snapshot Capture
The system captures daily snapshots of wishlist stocks and compares them with previous data:

```bash
# Run manually
node scripts/captureWishlistSnapshots.js
```

This script:
1. Captures current data for all wishlisted stocks
2. Compares with previous snapshots
3. Generates alerts when changes exceed thresholds
4. Stores alerts in the database

### Scheduled Execution
The scheduler runs daily at 8:00 PM (configured in `scripts/scheduler.js`):
- Updates stock data
- Captures wishlist snapshots
- Generates alerts automatically

## 🧪 Testing

### Create Test Alerts
```bash
node scripts/createTestAlerts.js
```

This creates 5 sample alerts demonstrating different alert types and severities.

### Test Alert from API
```bash
curl -X POST http://localhost:5000/api/alerts/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

## 📱 Mobile App Integration

### AlertService (`lib/services/alert_service.dart`)
Handles all alert-related API calls:
- Fetch alerts (with pagination)
- Get unread count
- Mark as read
- Delete alerts

### AlertsScreen (`lib/screens/alerts_screen.dart`)
Beautiful UI for viewing and managing alerts:
- Segmented control (All/Unread)
- Color-coded severity indicators
- Swipe gestures for quick actions
- Bottom sheet for alert details
- Pull-to-refresh

### Home Screen Integration
- Bell icon with unread badge
- Automatically refreshes count after viewing alerts
- Positioned next to logout button

## 🎨 UI/UX Features

### Color Coding
- **Critical alerts**: Red indicators
- **Warning alerts**: Orange indicators
- **Info alerts**: Blue indicators

### Visual Indicators
- Unread alerts have:
  - Light blue background
  - Bold title text
  - Small colored dot
  - Colored border

### Interactive Elements
- **Pull to Refresh**: Swipe down to refresh alerts
- **Swipe Gestures**: Quick mark as read or delete
- **Modal Details**: Tap for full alert information
- **Empty States**: Friendly messages when no alerts exist

## 🔧 Configuration

### Alert Thresholds (in `alertService.js`)
```javascript
// Price change threshold
const PRICE_CHANGE_THRESHOLD = 5; // 5%

// P/E ratio threshold
const PE_CHANGE_THRESHOLD = 15; // 15%

// Volume spike threshold
const VOLUME_SPIKE_THRESHOLD = 50; // 50%

// Dividend change threshold  
const DIVIDEND_CHANGE_THRESHOLD = 20; // 20%
```

### Severity Rules
```javascript
// Critical: 10%+ price change
// Warning: 5-10% price change, volume spikes
// Info: P/E changes, dividend changes
```

## 📈 Future Enhancements

Potential improvements:
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Custom threshold settings per user
- [ ] Alert preferences (enable/disable alert types)
- [ ] Email notifications
- [ ] Alert history analytics
- [ ] Bulk actions on alerts
- [ ] Alert filtering by symbol/type
- [ ] Alert grouping by stock

## 🐛 Troubleshooting

### No alerts appearing?
1. Ensure wishlist has stocks
2. Run snapshot capture: `node scripts/captureWishlistSnapshots.js`
3. Check database: `SELECT * FROM wishlist_alerts`

### Unread count not updating?
- Pull to refresh on home screen
- Check network connection
- Verify API endpoint is accessible

### Alerts not being generated?
- Ensure scheduler is running
- Check that snapshots are being captured
- Verify threshold values in `alertService.js`

## 📞 API Response Examples

### Get Alerts
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "AAPL",
      "alert_type": "price_increase",
      "title": "Apple Inc. Price Increased",
      "message": "AAPL price increased by 7.5%...",
      "old_value": 150.00,
      "new_value": 161.25,
      "change_percentage": 7.5,
      "severity": "warning",
      "is_read": false,
      "created_at": "2026-02-07T10:30:00Z",
      "company_name": "Apple Inc."
    }
  ],
  "count": 1
}
```

### Get Unread Count
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

## 🎉 Summary

Your alert system is now **fully operational**! The system will:
1. ✅ Monitor all your wishlist stocks automatically
2. ✅ Generate alerts when significant changes occur
3. ✅ Display notifications in the mobile app with a bell icon
4. ✅ Show unread count badge
5. ✅ Allow easy management of alerts (read, delete, view details)

**Start adding stocks to your wishlist and the system will alert you about important changes!** 📊🔔
