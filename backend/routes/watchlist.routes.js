/**
 * Watchlist Management Routes
 * REST API endpoints for user watchlist operations with REAL-TIME PRICES
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, param, validationResult } = require('express-validator');
const DataFreshnessService = require('../services/dataFreshness.service');
const finnhubService = require('../services/finnhub.service');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/watchlist/:userId
 * @desc    Get user's watchlist with full stock details
 * @access  Public
 */
router.get('/:userId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Watchlist] Fetching watchlist for user: ${userId}`);
    
    const query = `
      SELECT 
        w.id as watchlist_id,
        w.user_id,
        w.company_id,
        w.added_at,
        c.symbol,
        c.name,
        c.sector,
        c.exchange,
        COALESCE(f.pe_ratio, 0) as pe_ratio,
        COALESCE(f.market_cap, 0) as market_cap,
        COALESCE(f.eps, 0) as eps,
        COALESCE(f.debt_to_fcf, 0) as debt_to_fcf,
        COALESCE(f.revenue_growth, 0) as revenue_growth,
        COALESCE(f.peg_ratio, 0) as peg_ratio,
        COALESCE(f.updated_at, NOW()) as data_updated_at
      FROM watchlist w
      INNER JOIN companies c ON w.company_id = c.id
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;

    const result = await db.query(query, [userId]);
    
    console.log(`[Watchlist] Found ${result.rows.length} items`);

    // Fetch real-time prices from Finnhub for all watchlist stocks
    const symbols = result.rows.map(row => row.symbol);
    const priceData = await finnhubService.getQuotes(symbols);
    
    // Create price map - strip .NS suffix for matching with database symbols
    const priceMap = new Map(
      priceData.map(p => {
        const baseSymbol = p.symbol.replace(/\.(NS|BO)$/, ''); // Remove exchange suffix
        return [baseSymbol, p];
      })
    );
    
    console.log(`[Watchlist] Fetched prices for ${priceData.length}/${symbols.length} stocks`);

    // Extract the freshness timestamp from first result (all rows have same timestamp)
    const lastUpdatedAt = result.rows.length > 0 ? result.rows[0].data_updated_at : new Date();
    const freshness = DataFreshnessService.calculateFreshness(lastUpdatedAt);

    // Enrich watchlist items with real-time prices
    const watchlistItems = result.rows.map(row => {
      const { data_updated_at, ...item } = row;
      const prices = priceMap.get(row.symbol);
      
      // Convert PostgreSQL numeric strings to numbers
      return {
        ...item,
        pe_ratio: parseFloat(item.pe_ratio) || 0,
        market_cap: parseFloat(item.market_cap) || 0,
        eps: parseFloat(item.eps) || 0,
        debt_to_fcf: parseFloat(item.debt_to_fcf) || 0,
        revenue_growth: parseFloat(item.revenue_growth) || 0,
        peg_ratio: parseFloat(item.peg_ratio) || 0,
        current_price: prices?.current_price || 0,
        previous_close: prices?.previous_close || 0,
        change_percent: prices?.change_percent || 0,
        volume: prices?.volume || 0,
        last_price_update: prices?.timestamp,
        price_source: prices?.data_source || 'UNKNOWN',
        is_real_data: prices?.is_real_data || false,
        is_delayed: prices?.is_delayed || false,
        delay_minutes: prices?.delay_minutes || 0
      };
    });

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        watchlist: watchlistItems,
        total_count: watchlistItems.length
      },
      metadata: {
        freshness: freshness,
        source: 'WATCHLIST_API',
        prices_fetched: priceData.length,
        real_prices_count: priceData.filter(p => !p.isMock).length
      }
    });
  } catch (error) {
    console.error('[Watchlist] List error:', error);

    // Even on error, return freshness metadata to indicate fallback
    const fallbackFreshness = DataFreshnessService.calculateFreshness(null);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist',
      message: error.message,
      metadata: {
        freshness: fallbackFreshness,
        source: 'FALLBACK'
      }
    });
  }
});

/**
 * @route   POST /api/watchlist/add
 * @desc    Add stock to watchlist
 * @access  Public
 * @body    { userId, symbol }
 */
router.post('/add', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid stock symbol required')
], validate, async (req, res) => {
  try {
    const { userId, symbol } = req.body;

    console.log(`[Watchlist] Adding ${symbol} to watchlist for user: ${userId}`);
    
    // Find company ID by symbol
    const companyQuery = 'SELECT id FROM companies WHERE symbol = $1';
    const companyResult = await db.query(companyQuery, [symbol.toUpperCase()]);
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
        message: `Symbol ${symbol} does not exist`
      });
    }

    const companyId = companyResult.rows[0].id;

    // Check if already in watchlist
    const checkQuery = 'SELECT id FROM watchlist WHERE user_id = $1 AND company_id = $2';
    const checkResult = await db.query(checkQuery, [userId, companyId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Already in watchlist',
        message: `${symbol} is already in your watchlist`
      });
    }

    // Insert into watchlist
    const insertQuery = `
      INSERT INTO watchlist (user_id, company_id)
      VALUES ($1, $2)
      RETURNING id, user_id, company_id, added_at
    `;
    const insertResult = await db.query(insertQuery, [userId, companyId]);

    res.status(201).json({
      success: true,
      message: `${symbol} added to watchlist`,
      data: insertResult.rows[0]
    });
  } catch (error) {
    console.error('[Watchlist] Add error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to watchlist',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/watchlist/remove
 * @desc    Remove stock from watchlist
 * @access  Public
 * @body    { userId, symbol }
 */
router.delete('/remove', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid stock symbol required')
], validate, async (req, res) => {
  try {
    const { userId, symbol } = req.body;

    console.log(`[Watchlist] Removing ${symbol} from watchlist for user: ${userId}`);
    
    // Find company ID by symbol
    const companyQuery = 'SELECT id FROM companies WHERE symbol = $1';
    const companyResult = await db.query(companyQuery, [symbol.toUpperCase()]);
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    const companyId = companyResult.rows[0].id;

    const deleteQuery = `
      DELETE FROM watchlist 
      WHERE user_id = $1 AND company_id = $2
      RETURNING id
    `;
    const result = await db.query(deleteQuery, [userId, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not in watchlist',
        message: `${symbol} was not in your watchlist`
      });
    }

    res.json({
      success: true,
      message: `${symbol} removed from watchlist`
    });
  } catch (error) {
    console.error('[Watchlist] Remove error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from watchlist',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/watchlist/:userId/check/:symbol
 * @desc    Check if symbol is in watchlist
 * @access  Public
 */
router.get('/:userId/check/:symbol', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  param('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid symbol required')
], validate, async (req, res) => {
  try {
    const { userId, symbol } = req.params;

    const query = `
      SELECT w.id 
      FROM watchlist w
      INNER JOIN companies c ON w.company_id = c.id
      WHERE w.user_id = $1 AND c.symbol = $2
    `;
    const result = await db.query(query, [userId, symbol.toUpperCase()]);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        is_in_watchlist: result.rows.length > 0
      }
    });
  } catch (error) {
    console.error('[Watchlist] Check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check watchlist status',
      message: error.message
    });
  }
});

module.exports = router;
