const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's wishlist with daily change tracking
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const query = `
      SELECT 
        w.id as wishlist_id,
        w.symbol,
        w.added_at,
        s.company_name,
        s.sector,
        s.industry,
        s.exchange,
        s.market_cap,
        f.pe_ratio,
        f.pb_ratio,
        f.eps,
        f.profit_margin,
        f.dividend_yield,
        f.beta,
        
        -- Get current price from earnings_analyst_data or latest price_history
        COALESCE(ead.current_price, latest_price.close, latest_price.adjusted_close) as current_price,
        
        -- Today's snapshot data
        today_snapshot.open_price as today_open,
        today_snapshot.high_price as today_high,
        today_snapshot.low_price as today_low,
        today_snapshot.volume as today_volume,
        today_snapshot.price_change,
        today_snapshot.price_change_percentage,
        today_snapshot.volume_change_percentage,
        today_snapshot.current_price as today_price,
        
        -- Yesterday's snapshot data
        yesterday_snapshot.current_price as yesterday_price,
        yesterday_snapshot.volume as yesterday_volume,
        yesterday_snapshot.pe_ratio as yesterday_pe_ratio,
        yesterday_snapshot.market_cap as yesterday_market_cap,
        yesterday_snapshot.snapshot_date as yesterday_date
        
      FROM wishlist w
      LEFT JOIN stocks s ON w.symbol = s.symbol
      LEFT JOIN fundamentals f ON w.symbol = f.symbol
      LEFT JOIN earnings_analyst_data ead ON w.symbol = ead.symbol
      
      -- Get latest price from price_history as fallback
      LEFT JOIN LATERAL (
        SELECT close, adjusted_close
        FROM price_history
        WHERE symbol = w.symbol
        ORDER BY date DESC
        LIMIT 1
      ) latest_price ON true
      
      -- Get today's snapshot
      LEFT JOIN LATERAL (
        SELECT *
        FROM wishlist_history
        WHERE user_id = w.user_id 
          AND symbol = w.symbol
          AND snapshot_date = CURRENT_DATE
        LIMIT 1
      ) today_snapshot ON true
      
      -- Get yesterday's snapshot
      LEFT JOIN LATERAL (
        SELECT *
        FROM wishlist_history
        WHERE user_id = w.user_id 
          AND symbol = w.symbol
          AND snapshot_date < CURRENT_DATE
        ORDER BY snapshot_date DESC
        LIMIT 1
      ) yesterday_snapshot ON true
      
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      wishlist: result.rows
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
});

// Add stock to wishlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }
    
    // Check if stock exists
    const stockCheck = await db.query(
      'SELECT symbol FROM stocks WHERE symbol = $1',
      [symbol]
    );
    
    if (stockCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }
    
    // Check if already in wishlist
    const existingCheck = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock already in wishlist'
      });
    }
    
    // Add to wishlist
    const insertQuery = `
      INSERT INTO wishlist (user_id, symbol, added_at)
      VALUES ($1, $2, NOW())
      RETURNING id, symbol, added_at
    `;
    
    const result = await db.query(insertQuery, [userId, symbol]);
    
    res.status(201).json({
      success: true,
      message: 'Stock added to wishlist',
      wishlist_item: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add stock to wishlist',
      error: error.message
    });
  }
});

// Remove stock from wishlist
router.delete('/:symbol', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;
    
    const result = await db.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND symbol = $2 RETURNING id',
      [userId, symbol]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in wishlist'
      });
    }
    
    res.json({
      success: true,
      message: 'Stock removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove stock from wishlist',
      error: error.message
    });
  }
});

// Check if stock is in wishlist
router.get('/check/:symbol', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;
    
    const result = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );
    
    res.json({
      success: true,
      inWishlist: result.rows.length > 0
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message
    });
  }
});

// Get historical snapshots for a wishlisted stock
router.get('/history/:symbol', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;
    const { days = 30 } = req.query; // Default to last 30 days
    
    // Verify stock is in user's wishlist
    const wishlistCheck = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );
    
    if (wishlistCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in wishlist'
      });
    }
    
    // Get historical snapshots
    const historyQuery = `
      SELECT 
        snapshot_date,
        current_price,
        open_price,
        high_price,
        low_price,
        volume,
        pe_ratio,
        pb_ratio,
        eps,
        dividend_yield,
        market_cap,
        price_change,
        price_change_percentage,
        volume_change_percentage
      FROM wishlist_history
      WHERE user_id = $1 
        AND symbol = $2
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      ORDER BY snapshot_date DESC
    `;
    
    const result = await db.query(historyQuery, [userId, symbol]);
    
    res.json({
      success: true,
      symbol: symbol,
      count: result.rows.length,
      history: result.rows
    });
  } catch (error) {
    console.error('Error fetching wishlist history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist history',
      error: error.message
    });
  }
});

module.exports = router;
