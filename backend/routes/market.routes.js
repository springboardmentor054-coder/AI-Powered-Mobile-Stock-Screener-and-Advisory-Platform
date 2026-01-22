const express = require("express");
const router = express.Router();
const pool = require("../database");

/**
 * GET /stocks/:symbol/quote
 * Get real-time quote for a stock
 */
router.get("/stocks/:symbol/quote", async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Get stock data with simulated real-time pricing
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
        f.eps,
        -- Simulate current price (in production, fetch from real API)
        (1000 + RANDOM() * 500)::decimal(10,2) as current_price,
        (- 5 + RANDOM() * 10)::decimal(5,2) as change_percent,
        (- 50 + RANDOM() * 100)::decimal(10,2) as change_amount,
        (1000 + RANDOM() * 100)::decimal(10,2) as day_high,
        (900 + RANDOM() * 100)::decimal(10,2) as day_low,
        (1000000 + RANDOM() * 5000000)::bigint as volume
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      WHERE c.symbol = $1`,
      [symbol.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Stock not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
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

module.exports = router;
