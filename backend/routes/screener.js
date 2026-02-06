const express = require("express");
const router = express.Router();
const pool = require("../database");
const { parseQuery } = require("../llm");
const { compileDSL } = require("../compileDSL");
const { validateDSL } = require("../services/validationService");
const queryCache = require("../services/queryCache.service");
const marketDataService = require("../services/realTimeMarketData.service");

/**
 * POST /screener
 * Natural language stock screening endpoint with caching and REAL price data
 * 
 * Body: { "query": "Show IT stocks with PE below 5" }
 * Returns: Array of matching stocks with real-time prices
 */
router.post("/screener", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query is required and must be a string"
      });
    }
    
    console.log(`[Screener] Processing query: "${query}"`);
    
    // Parse natural language to DSL
    const dsl = await parseQuery(query);
    validateDSL(dsl);
    
    // Check cache
    const cachedResult = await queryCache.get(dsl);
    if (cachedResult) {
      console.log('[Screener] Cache hit');
      return res.json({
        success: true,
        data: cachedResult,
        cached: true,
        execution_time_ms: Date.now() - startTime
      });
    }
    
    // Execute query to get fundamentals
    const sql = compileDSL(dsl);
    const result = await pool.query(sql.sql, sql.params);
    
    console.log(`[Screener] Found ${result.rows.length} matching stocks`);

    // Enrich with real-time prices from Yahoo Finance
    const symbols = result.rows.map(s => s.symbol || s.ticker);
    const priceData = await marketDataService.getBulkRealtimeData(symbols);
    const priceMap = new Map(priceData.map(p => [p.symbol, p]));
    
    console.log(`[Screener] Fetched prices for ${priceData.length}/${symbols.length} stocks`);

    // Merge data
    const enrichedResults = result.rows.map(stock => {
      const prices = priceMap.get(stock.symbol || stock.ticker);
      
      return {
        ...stock,
        current_price: prices?.currentPrice || 0,
        previous_close: prices?.previousClose || 0,
        change_percent: prices?.changePercent || 0,
        volume: prices?.volume || 0,
        last_update: prices?.lastUpdate,
        data_source: prices?.isMock ? 'MOCK' : 'YAHOO_FINANCE'
      };
    });

    // Cache enriched results
    await queryCache.set(dsl, enrichedResults);

    res.json({
      success: true,
      data: enrichedResults,
      cached: false,
      execution_time_ms: Date.now() - startTime,
      count: enrichedResults.length
    });
  } catch (err) {
    console.error('[Screener] Error:', err);
    res.status(400).json({
      success: false,
      error: err.message,
      execution_time_ms: Date.now() - startTime
    });
  }
});

/**
 * GET /screener/cache/stats
 * Get cache performance statistics
 */
router.get("/cache/stats", (req, res) => {
  res.json({
    success: true,
    data: queryCache.getStats()
  });
});

/**
 * DELETE /screener/cache
 * Clear query cache
 */
router.delete("/cache", async (req, res) => {
  try {
    await queryCache.clearAll();
    res.json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
