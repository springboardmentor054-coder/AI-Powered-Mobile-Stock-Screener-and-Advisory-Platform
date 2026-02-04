const db = require('../config/db');
const redis = require('../config/redis');

// 1. Get Dashboard (Watchlist + Redis History)
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; 

    // A. Watchlist (DB)
    const watchlistQuery = `
      SELECT c.ticker_symbol, c.company_name, c.sector,
             pm.current_price, pm.price_change_percent, pm.fifty_two_week_high
      FROM watchlist_items w
      JOIN companies c ON w.company_id = c.id
      LEFT JOIN price_market_data pm ON c.id = pm.company_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const watchlist = await db.query(watchlistQuery, [userId]);

    // B. History (Redis) - Get last 10 items (SUPER FAST)
    // We still read from Redis for the dashboard because it's instant
    const recentQueries = await redis.lRange(`history:${userId}`, 0, 9);

    res.json({
      watchlist: watchlist.rows,
      recentQueries: recentQueries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// 2. Add to Watchlist (Unchanged)
exports.addToWatchlist = async (req, res) => {
  try {
    const { ticker } = req.body;
    const userId = req.user.id;

    const company = await db.query("SELECT id FROM companies WHERE ticker_symbol = $1", [ticker]);
    if (company.rows.length === 0) return res.status(404).json({ error: "Ticker not found" });

    await db.query(
      "INSERT INTO watchlist_items (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, company.rows[0].id]
    );
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add" });
  }
};

// 3. Remove from Watchlist (Unchanged)
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { ticker } = req.body;
    const userId = req.user.id;
    
    await db.query(`
      DELETE FROM watchlist_items 
      WHERE user_id = $1 AND company_id = (SELECT id FROM companies WHERE ticker_symbol = $2)
    `, [userId, ticker]);
    
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove" });
  }
};

// --- UPDATED: Track Search (DB + Redis) ---
exports.trackSearch = async (userId, queryText) => {
  if (!userId || !queryText) return;

  try {
    // 1. SAVE TO POSTGRES (Permanent Storage)
    // We don't await this because we don't want to slow down the user response
    // if the DB insert takes a few milliseconds.
    db.query(
      'INSERT INTO search_history (user_id, query_text) VALUES ($1, $2)', 
      [userId, queryText]
    ).catch(err => console.error("❌ DB History Save Failed:", err.message));

    // 2. SAVE TO REDIS (Fast Access for Dashboard)
    const key = `history:${userId}`;
    await redis.lPush(key, queryText); // Add to start of list
    await redis.lTrim(key, 0, 9);      // Keep only top 10

  } catch (err) {
    console.error("Tracking Error:", err);
  }
};