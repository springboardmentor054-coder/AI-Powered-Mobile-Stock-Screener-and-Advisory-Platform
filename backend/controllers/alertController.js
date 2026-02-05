const db = require('../config/db');

// 1. Create a New Alert
exports.createAlert = async (req, res) => {
  try {
    // These match exactly what your AlertModal.jsx sends
    const { ticker, metric, operator, value } = req.body;
    const userId = req.user.id;

    // A. Validate Metric (Security: prevent SQL injection)
    const VALID_METRICS = [
      'current_price', 'price_change_percent', 'fifty_two_week_high',
      'pe_ratio', 'pb_ratio', 'dividend_yield',
      'revenue_growth', 'profit_margins', 'debt_to_equity'
    ];
    if (!VALID_METRICS.includes(metric)) {
      return res.status(400).json({ error: "Invalid metric selected" });
    }

    // B. Find Company ID
    const companyRes = await db.query("SELECT id FROM companies WHERE ticker_symbol = $1", [ticker]);
    if (companyRes.rows.length === 0) return res.status(404).json({ error: "Ticker not found" });
    const companyId = companyRes.rows[0].id;

    // C. Save the Alert
    await db.query(
      `INSERT INTO stock_alerts (user_id, company_id, metric_column, operator, threshold_value) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, companyId, metric, operator, value]
    );

    console.log(`✅ Alert Created: ${ticker} ${metric} ${operator} ${value}`);
    res.json({ message: "Alert created successfully" });

  } catch (err) {
    console.error("Create Alert Error:", err);
    res.status(500).json({ error: "Failed to create alert" });
  }
};

// 2. Get Notifications (For the Bell Icon in Navbar later)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Security: Ensure the notification belongs to this user
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

// 2. Delete Notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

exports.getAlertsForStock = async (req, res) => {
  try {
    const { ticker } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT a.* FROM stock_alerts a
      JOIN companies c ON a.company_id = c.id
      WHERE a.user_id = $1 AND c.ticker_symbol = $2
      ORDER BY a.created_at DESC
    `;
    const result = await db.query(query, [userId, ticker]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// 2. Reactivate an Alert
exports.reactivateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;


    await db.query(
      `UPDATE stock_alerts SET status = 'ACTIVE' WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    console.log(`✅ Alert Reactivated: ID ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reactivate" });
  }
};

// 3. Delete an Alert Rule
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `DELETE FROM stock_alerts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
};

exports.getAllUserAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Join with companies to get the ticker symbol
    const query = `
      SELECT a.id, a.metric_column, a.operator, a.threshold_value, a.status, c.ticker_symbol 
      FROM stock_alerts a
      JOIN companies c ON a.company_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;

    
    const result = await db.query(query, [userId]);
    console.log(`✅ Fetched ${result.rows.length} alerts for user ${userId}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};