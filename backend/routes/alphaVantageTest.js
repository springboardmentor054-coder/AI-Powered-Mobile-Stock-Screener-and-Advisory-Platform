const express = require("express");
const alphaVantageService = require("../services/alphaVantageService");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Test Alpha Vantage API - Get company overview
 * GET /api/test/overview/:symbol
 */
router.get("/overview/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await alphaVantageService.getCompanyOverview(symbol);
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
 * Test Alpha Vantage API - Get current quote
 * GET /api/test/quote/:symbol
 */
router.get("/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await alphaVantageService.getGlobalQuote(symbol);
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
 * Test Alpha Vantage API - Get income statement
 * GET /api/test/income/:symbol
 */
router.get("/income/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await alphaVantageService.getIncomeStatement(symbol);
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
 * Test Alpha Vantage API - Get comprehensive data
 * GET /api/test/comprehensive/:symbol
 * WARNING: This makes 6 API calls and takes ~1 minute due to rate limiting
 */
router.get("/comprehensive/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    res.json({
      success: true,
      message: "Fetching comprehensive data... This will take about 1 minute due to rate limits.",
      note: "Check server logs for progress"
    });
    
    // Fetch data asynchronously
    alphaVantageService.getComprehensiveStockData(symbol)
      .then(data => {
        console.log(`Comprehensive data for ${symbol} fetched successfully`);
      })
      .catch(error => {
        console.error(`Error fetching comprehensive data for ${symbol}:`, error.message);
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test Alpha Vantage API - Get earnings calendar
 * GET /api/test/earnings-calendar
 * GET /api/test/earnings-calendar/:symbol
 */
router.get("/earnings-calendar/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await alphaVantageService.getEarningsCalendar(symbol);
    res.json({
      success: true,
      data: data.slice(0, 10) // Return first 10 results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/earnings-calendar", async (req, res) => {
  try {
    const data = await alphaVantageService.getEarningsCalendar(null);
    res.json({
      success: true,
      data: data.slice(0, 10) // Return first 10 results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
