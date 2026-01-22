const express = require("express");
const router = express.Router();
const pool = require("../database");
const { parseQuery } = require("../llm");
const { compileDSL } = require("../compileDSL");
const { validateDSL } = require("../services/validationService");
const queryCache = require("../services/queryCache.service");

/**
 * POST /screener
 * Natural language stock screening endpoint with caching
 * 
 * Body: { "query": "Show IT stocks with PE below 5" }
 * Returns: Array of matching stocks
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
    
    // Parse natural language to DSL
    const dsl = await parseQuery(query);
    validateDSL(dsl);
    
    // Check cache
    const cachedResult = await queryCache.get(dsl);
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        cached: true,
        execution_time_ms: Date.now() - startTime
      });
    }
    
    // Execute query
    const sql = compileDSL(dsl);
    const result = await pool.query(sql.sql, sql.params);

    // Cache results
    await queryCache.set(dsl, result.rows);

    res.json({
      success: true,
      data: result.rows,
      cached: false,
      execution_time_ms: Date.now() - startTime,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Screener error:', err);
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
