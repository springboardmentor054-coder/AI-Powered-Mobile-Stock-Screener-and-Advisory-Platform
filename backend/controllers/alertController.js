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