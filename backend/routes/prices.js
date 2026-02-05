const express = require('express');
const router = express.Router();
const { 
  getPriceHistory, 
  getLatestPrice, 
  getPriceChangeStats 
} = require('../services/stockDataService');

/**
 * GET /api/prices/:symbol/history
 * Get historical price data for a stock
 * Query params:
 *   - startDate: YYYY-MM-DD (optional, defaults to 30 days ago)
 *   - endDate: YYYY-MM-DD (optional, defaults to today)
 *   - days: number (alternative to startDate, gets last N days)
 */
router.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    let { startDate, endDate, days } = req.query;

    // Calculate date range
    if (days) {
      endDate = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - parseInt(days));
      startDate = start.toISOString().split('T')[0];
    } else {
      endDate = endDate || new Date().toISOString().split('T')[0];
      if (!startDate) {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        startDate = start.toISOString().split('T')[0];
      }
    }

    const priceData = await getPriceHistory(symbol, startDate, endDate);

    res.json({
      success: true,
      symbol,
      startDate,
      endDate,
      count: priceData.length,
      data: priceData
    });

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prices/:symbol/latest
 * Get the most recent price data for a stock
 */
router.get('/:symbol/latest', async (req, res) => {
  try {
    const { symbol } = req.params;
    const latestPrice = await getLatestPrice(symbol);

    if (!latestPrice) {
      return res.status(404).json({
        success: false,
        error: 'No price data found for this stock'
      });
    }

    res.json({
      success: true,
      data: latestPrice
    });

  } catch (error) {
    console.error('Error fetching latest price:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prices/:symbol/stats
 * Get price change statistics
 * Query params:
 *   - days: number (default 30)
 */
router.get('/:symbol/stats', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days) || 30;

    const stats = await getPriceChangeStats(symbol, days);

    res.json({
      success: true,
      symbol,
      period: `${days} days`,
      stats
    });

  } catch (error) {
    console.error('Error fetching price stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prices/:symbol/chart
 * Get formatted chart data for visualization
 * Query params:
 *   - days: number (default 30)
 */
router.get('/:symbol/chart', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days) || 30;

    const endDate = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().split('T')[0];

    const priceData = await getPriceHistory(symbol, startDate, endDate);

    // Format for charts (reverse to chronological order)
    const chartData = priceData.reverse().map(day => ({
      date: day.date,
      price: day.close,
      open: day.open,
      high: day.high,
      low: day.low,
      volume: day.volume
    }));

    res.json({
      success: true,
      symbol,
      period: `${days} days`,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
