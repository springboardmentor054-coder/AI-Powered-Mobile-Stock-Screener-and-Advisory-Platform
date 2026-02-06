# Alert Service - Usage Examples

## New Alert Features

The alert service now includes advanced batch notification and severity-based delivery capabilities.

### 1. Process Pending Alerts (Batch Notification)

Automatically fetch pending alerts and send batch notification:

```javascript
const alertService = require('./services/alert.service');

// Process all pending alerts for a user
const result = await alertService.processPendingAlerts(userId);

if (result.processed) {
  console.log(`Sent batch notification with ${result.count} alerts`);
}
```

### 2. Manual Batch Processing

Get pending alerts and process them manually:

```javascript
const pendingAlerts = await alertService.getPendingAlerts(userId);

if (pendingAlerts.length > 0) {
  await alertService.sendBatchNotification(userId, pendingAlerts);
  await alertService.markAlertsAsDelivered(pendingAlerts);
}
```

### 3. Severity-Based Delivery

Automatically deliver alerts based on severity:

```javascript
// Create an alert
const alert = await alertService.createAlert({
  userId: 1,
  companyId: 5,
  alertType: 'price_target',
  severity: 'high', // or 'critical', 'medium', 'low'
  title: 'Price Target Reached',
  description: 'TCS has reached your target price of ₹3500'
});

// Process delivery based on severity
if (!alert.suppressed) {
  await alertService.processAlertDelivery(alert);
  // HIGH/CRITICAL -> delivers immediately
  // MEDIUM/LOW -> schedules for daily digest
}
```

### 4. Manual Severity-Based Handling

Handle different severities manually:

```javascript
const alert = await alertService.createAlert({...});

if (!alert.suppressed) {
  if (alert.severity === 'high' || alert.severity === 'critical') {
    // Deliver immediately
    await alertService.deliverNow(alert);
  } else {
    // Schedule for later delivery
    await alertService.scheduleForLater(alert, 'DAILY_DIGEST');
  }
}
```

### 5. Get Pending Alerts

Retrieve all undelivered alerts for a user:

```javascript
const pendingAlerts = await alertService.getPendingAlerts(userId);

// Alerts are automatically sorted by:
// 1. Severity (critical -> high -> medium -> low)
// 2. Triggered time (newest first)

console.log(`User has ${pendingAlerts.length} pending alerts`);
```

### 6. Batch Notification with Summary

Send grouped notifications:

```javascript
const result = await alertService.sendBatchNotification(userId, alerts);

// Result includes summary:
// {
//   sent: true,
//   notification: {
//     summary: {
//       total: 5,
//       critical: 1,
//       high: 2,
//       medium: 1,
//       low: 1
//     },
//     alerts: [...]
//   }
// }
```

## Integration Examples

### Daily Digest Job

```javascript
// In a cron job or scheduled task
const cron = require('node-cron');
const alertService = require('./services/alert.service');

// Run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily digest...');
  
  // Get all users with pending alerts
  const users = await getAllUsersWithPendingAlerts();
  
  for (const user of users) {
    await alertService.processPendingAlerts(user.id);
  }
});
```

### Real-time Alert Processing

```javascript
// When creating alerts in real-time
async function handleNewAlert(alertData) {
  const alert = await alertService.createAlert(alertData);
  
  if (!alert.suppressed) {
    // Automatically handle delivery based on severity
    const deliveryResult = await alertService.processAlertDelivery(alert);
    
    if (deliveryResult.deliveryType === 'immediate') {
      console.log('Alert delivered immediately');
    } else if (deliveryResult.scheduled) {
      console.log(`Alert scheduled for ${deliveryResult.scheduleType}`);
    }
  }
}
```

### API Endpoint Example

```javascript
// In your Express routes
router.get('/alerts/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const pendingAlerts = await alertService.getPendingAlerts(userId);
    res.json(pendingAlerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/process-pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await alertService.processPendingAlerts(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Alert Severity Guidelines

- **CRITICAL**: System failures, security issues, urgent action required
- **HIGH**: Important price movements, target reached, significant changes
- **MEDIUM**: Notable updates, earnings reports, analyst recommendations
- **LOW**: General information, minor changes, educational content

## Schedule Types

- `DAILY_DIGEST`: Delivered once per day (default for medium/low severity)
- `WEEKLY_DIGEST`: Delivered once per week
- `CUSTOM`: Custom schedule based on user preferences
