const db = require('../config/db');
const redis = require('../config/redis');

// 1. Get Dashboard (Watchlist + Redis History)
exports.getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id; 
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
    res.json(watchlist.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

exports.getRecentQueries = async (req, res) => {
  try {
    const userId = req.user.id;
    const historyKey = `history:${userId}`;
    
    // Fetch top 10 recent searches from Redis
    const recentQueries = await redis.lRange(historyKey, 0, 9);
    
    res.json(recentQueries || []);
  } catch (err) {
    console.error("Redis Error:", err);
    res.status(500).json({ error: "Failed to fetch queries" });
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

// ... existing imports

exports.getSearchStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // UPDATED QUERY: Group by exact date (YYYY-MM-DD)
    const query = `
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date_group, COUNT(*) as count 
      FROM search_history 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

