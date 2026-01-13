const express = require("express");
const db = require("../config/database");
const stockDataService = require("../services/stockDataService");

const router = express.Router();

/**
 * Test database connection
 * GET /api/db-test/connection
 */
router.get("/connection", async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? "Database connected successfully" : "Database connection failed"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test inserting sample stock
 * POST /api/db-test/insert-sample
 */
router.post("/insert-sample", async (req, res) => {
  try {
    // Insert sample stock
    const stock = await stockDataService.upsertStock({
      symbol: "TEST",
      companyName: "Test Company Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Software",
      isActive: true
    });
    
    // Insert sample fundamentals
    const fundamentals = await stockDataService.upsertFundamentals({
      symbol: "TEST",
      peRatio: 25.5,
      pegRatio: 2.1,
      totalDebt: 1000000,
      freeCashFlow: 500000,
      debtToFcfRatio: 2.0
    });
    
    res.json({
      success: true,
      message: "Sample data inserted successfully",
      data: { stock, fundamentals }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all stocks
 * GET /api/db-test/stocks
 */
router.get("/stocks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM stocks ORDER BY symbol LIMIT 10");
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get stocks by sector
 * GET /api/db-test/sector/:sector
 */
router.get("/sector/:sector", async (req, res) => {
  try {
    const { sector } = req.params;
    const stocks = await stockDataService.getStocksBySector(sector);
    res.json({
      success: true,
      sector,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get complete stock data
 * GET /api/db-test/stock/:symbol
 */
router.get("/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await stockDataService.getStockComplete(symbol);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get database statistics
 * GET /api/db-test/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const stockCount = await db.query("SELECT COUNT(*) as count FROM stocks");
    const fundamentalsCount = await db.query("SELECT COUNT(*) as count FROM fundamentals");
    const financialsCount = await db.query("SELECT COUNT(*) as count FROM financials");
    const earningsCount = await db.query("SELECT COUNT(*) as count FROM earnings_analyst_data");
    
    const sectorBreakdown = await db.query(`
      SELECT sector, COUNT(*) as count 
      FROM stocks 
      WHERE sector IS NOT NULL 
      GROUP BY sector 
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      statistics: {
        totalStocks: parseInt(stockCount.rows[0].count),
        withFundamentals: parseInt(fundamentalsCount.rows[0].count),
        financialRecords: parseInt(financialsCount.rows[0].count),
        withEarningsData: parseInt(earningsCount.rows[0].count),
        sectorBreakdown: sectorBreakdown.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear test data
 * DELETE /api/db-test/clear-test
 */
router.delete("/clear-test", async (req, res) => {
  try {
    await db.query("DELETE FROM stocks WHERE symbol = 'TEST'");
    res.json({
      success: true,
      message: "Test data cleared"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
