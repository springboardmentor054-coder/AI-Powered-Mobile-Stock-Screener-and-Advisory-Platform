const cron = require('node-cron');
const db = require('../config/db');

const startAlertJob = () => {
  console.log("⏰ Smart Alert Scheduler Started...");
  
  // Run every 1 minute (*/1 * * * *)
  cron.schedule('*/1 * * * *', async () => {
    // console.log("🔍 Checking alerts..."); // Uncomment to see logs every minute
    await checkSmartAlerts();
  });
};

async function checkSmartAlerts() {
  try {
    // 1. Fetch ALL Active Alerts + Join ALL Data Tables
    // We create a "Mega View" so we can check Price, Valuation, OR Financials
    const query = `
      SELECT 
        a.id AS alert_id, a.user_id, a.metric_column, a.operator, a.threshold_value,
        c.ticker_symbol,
        -- Price Data
        pm.current_price, pm.price_change_percent, pm.fifty_two_week_high,
        -- Valuation Data
        vm.pe_ratio, vm.pb_ratio, vm.dividend_yield,
        -- Financial Data
        fm.revenue_growth, fm.debt_to_equity
      FROM stock_alerts a
      JOIN companies c ON a.company_id = c.id
      LEFT JOIN price_market_data pm ON c.id = pm.company_id
      LEFT JOIN valuation_metrics vm ON c.id = vm.company_id
      LEFT JOIN financial_metrics fm ON c.id = fm.company_id
      WHERE a.status = 'ACTIVE'
    `;
    
    const res = await db.query(query);

    // 2. Evaluate Logic
    for (const row of res.rows) {
      const currentValue = Number(row[row.metric_column]); // Dynamic Access: row['pe_ratio']
      const threshold = Number(row.threshold_value);
      let triggered = false;

      if (isNaN(currentValue)) continue; // Skip if data missing

      switch (row.operator) {
        case '>': triggered = (currentValue > threshold); break;
        case '<': triggered = (currentValue < threshold); break;
        case '>=': triggered = (currentValue >= threshold); break;
        case '<=': triggered = (currentValue <= threshold); break;
      }

      // 3. Trigger Notification
      if (triggered) {
        console.log(`🚨 ALERT: ${row.ticker_symbol} ${row.metric_column} is ${currentValue}`);
        
        const readableMetric = row.metric_column.replace(/_/g, ' ').toUpperCase();
        const msg = `Alert: ${row.ticker_symbol} ${readableMetric} is now ${currentValue.toFixed(2)} (Threshold: ${row.operator} ${threshold})`;

        // Save Notification
        await db.query(
          `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
          [row.user_id, 'Stock Alert', msg]
        );

        // Deactivate Alert (So we don't spam)
        await db.query(`UPDATE stock_alerts SET status = 'TRIGGERED' WHERE id = $1`, [row.alert_id]);
      }
    }
  } catch (err) {
    console.error("❌ Alert Job Error:", err.message);
  }
}

module.exports = { startAlertJob };