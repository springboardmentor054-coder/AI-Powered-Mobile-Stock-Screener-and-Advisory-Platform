const express = require("express");
const router = express.Router();
const pool = require("../database");
const finnhubService = require('../services/finnhub.service');

const TIMEFRAMES = {
  '1D': { resolution: '5', days: 1 },
  '1W': { resolution: '30', days: 7 },
  '1M': { resolution: '60', days: 30 },
  '3M': { resolution: 'D', days: 90 },
  '1Y': { resolution: 'D', days: 365 },
  '5Y': { resolution: 'W', days: 1825 }
};

function buildTimeRange(timeframe, resolutionOverride) {
  const key = String(timeframe || '1D').toUpperCase();
  const config = TIMEFRAMES[key] || TIMEFRAMES['1D'];
  const resolution = resolutionOverride || config.resolution;
  const to = Math.floor(Date.now() / 1000);
  const from = to - config.days * 24 * 60 * 60;
  return { resolution, from, to, timeframe: key };
}

/**
 * GET /stocks/:symbol/quote
 * Get real-time quote for a stock from Yahoo Finance
 */
router.get("/stocks/:symbol/quote", async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Fetch real-time data from Finnhub
    const realtimeData = await finnhubService.getQuote(symbol);
    
    // Get fundamental data from database
    const result = await pool.query(
      `SELECT 
        c.symbol,
        c.name,
        c.sector,
        c.exchange,
        f.pe_ratio,
        f.peg_ratio,
        f.debt_to_fcf,
        f.revenue_growth,
        f.market_cap,
        f.eps
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      WHERE c.symbol = $1`,
      [symbol.toUpperCase()]
    );

    const stockData = result.rows.length > 0 ? result.rows[0] : {};

    res.json({
      success: true,
      data: {
        ...stockData,
        ...realtimeData
      }
    });
  } catch (err) {
    console.error("Error fetching stock quote:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /market/overview
 * Get market overview (gainers, losers, most active)
 */
router.get("/market/overview", async (req, res) => {
  try {
    // Simulate market movers with random data
    const gainers = await pool.query(
      `SELECT 
        c.symbol,
        c.name,
        c.sector,
        f.market_cap,
        f.pe_ratio,
        (1000 + RANDOM() * 500)::decimal(10,2) as current_price,
        (3 + RANDOM() * 7)::decimal(5,2) as change_percent,
        (30 + RANDOM() * 70)::decimal(10,2) as change_amount
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      ORDER BY RANDOM()
      LIMIT 5`
    );

    const losers = await pool.query(
      `SELECT 
        c.symbol,
        c.name,
        c.sector,
        f.market_cap,
        f.pe_ratio,
        (1000 + RANDOM() * 500)::decimal(10,2) as current_price,
        (-7 + RANDOM() * 3)::decimal(5,2) as change_percent,
        (-70 + RANDOM() * 30)::decimal(10,2) as change_amount
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      ORDER BY RANDOM()
      LIMIT 5`
    );

    const mostActive = await pool.query(
      `SELECT 
        c.symbol,
        c.name,
        c.sector,
        f.market_cap,
        f.pe_ratio,
        (1000 + RANDOM() * 500)::decimal(10,2) as current_price,
        (-2 + RANDOM() * 4)::decimal(5,2) as change_percent,
        (-20 + RANDOM() * 40)::decimal(10,2) as change_amount,
        (5000000 + RANDOM() * 10000000)::bigint as volume
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      ORDER BY f.market_cap DESC
      LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        gainers: gainers.rows,
        losers: losers.rows,
        mostActive: mostActive.rows
      }
    });
  } catch (err) {
    console.error("Error fetching market overview:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /market/candles/:symbol
 * Get candlestick data (OHLC + volume) for a stock
 * Query: timeframe=1D|1W|1M|3M|1Y|5Y, resolution, from, to
 */
router.get('/market/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1D', resolution, from, to } = req.query;

    const range = buildTimeRange(timeframe, resolution);
    const fromSec = Number.isFinite(Number(from)) ? parseInt(from, 10) : range.from;
    const toSec = Number.isFinite(Number(to)) ? parseInt(to, 10) : range.to;

    const data = await finnhubService.getCandles(symbol, range.resolution, fromSec, toSec);

    res.json({
      success: true,
      data: {
        symbol: data.symbol,
        timeframe: range.timeframe,
        resolution: range.resolution,
        from: fromSec,
        to: toSec,
        candles: data.candles,
        data_source: data.data_source,
        is_real_data: data.is_real_data,
        is_delayed: data.is_delayed,
        delay_minutes: data.delay_minutes
      }
    });
  } catch (error) {
    console.error('Candle data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candle data'
    });
  }
});

/**
 * GET /stocks/:symbol/chart
 * Get intraday chart data for a stock
 */
router.get("/stocks/:symbol/chart", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '5min', limit = 50 } = req.query;
    
    // Generate simulated chart data
    const chartData = [];
    const basePrice = 1000 + Math.random() * 500;
    
    for (let i = parseInt(limit); i >= 0; i--) {
      const variation = -20 + Math.random() * 40;
      const timestamp = new Date(Date.now() - i * 5 * 60 * 1000); // 5-minute intervals
      
      chartData.push({
        time: timestamp.toISOString(),
        price: (basePrice + variation).toFixed(2),
        volume: Math.floor(100000 + Math.random() * 500000)
      });
    }

    res.json({
      success: true,
      data: {
        symbol,
        interval,
        chartData
      }
    });
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /realtime/:symbol
 * Get real-time data for a single stock from Finnhub
 */
router.get('/realtime/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await finnhubService.getQuote(symbol);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Real-time data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time data'
    });
  }
});

// Alias under /market for frontend consistency
router.get('/market/realtime/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await finnhubService.getQuote(symbol);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Real-time data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time data'
    });
  }
});

/**
 * POST /realtime/bulk
 * Get real-time data for multiple stocks from Finnhub
 * Body: { symbols: ['TCS', 'INFY', 'HDFCBANK'] }
 */
router.post('/realtime/bulk', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required'
      });
    }

    const data = await finnhubService.getQuotes(symbols);
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Bulk real-time data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bulk real-time data'
    });
  }
});

// Alias under /market for frontend consistency
router.post('/market/realtime/bulk', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required'
      });
    }

    const data = await finnhubService.getQuotes(symbols);

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Bulk real-time data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bulk real-time data'
    });
  }
});

/**
 * GET /intraday/:symbol
 * Get intraday chart data (5 days, 15min intervals)
 */
router.get('/intraday/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = buildTimeRange('1D', '5');
    const data = await finnhubService.getCandles(symbol, range.resolution, range.from, range.to);

    res.json({
      success: true,
      data: {
        symbol: data.symbol,
        timeframe: '1D',
        resolution: range.resolution,
        from: range.from,
        to: range.to,
        candles: data.candles,
        data_source: data.data_source,
        is_real_data: data.is_real_data,
        is_delayed: data.is_delayed,
        delay_minutes: data.delay_minutes
      }
    });
  } catch (error) {
    console.error('Intraday data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intraday data'
    });
  }
});

// Alias under /market for frontend consistency
router.get('/market/intraday/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = buildTimeRange('1D', '5');
    const data = await finnhubService.getCandles(symbol, range.resolution, range.from, range.to);

    res.json({
      success: true,
      data: {
        symbol: data.symbol,
        timeframe: '1D',
        resolution: range.resolution,
        from: range.from,
        to: range.to,
        candles: data.candles,
        data_source: data.data_source,
        is_real_data: data.is_real_data,
        is_delayed: data.is_delayed,
        delay_minutes: data.delay_minutes
      }
    });
  } catch (error) {
    console.error('Intraday data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intraday data'
    });
  }
});

module.exports = router;
