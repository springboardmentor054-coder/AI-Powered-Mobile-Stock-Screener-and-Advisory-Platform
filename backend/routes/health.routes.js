/**
 * Health and Admin Routes
 * Production-ready health monitoring and admin endpoints
 */

const express = require("express");
const router = express.Router();
const healthMonitor = require("../services/healthMonitor.service");
const queryCache = require("../services/queryCache.service");
const dataIngestion = require("../services/dataIngestion.service");

/**
 * GET /health
 * Quick health check for load balancers
 */
router.get("/health", (req, res) => {
  const health = healthMonitor.getQuickHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

/**
 * GET /health/detailed
 * Comprehensive health check with all components
 */
router.get("/health/detailed", async (req, res) => {
  try {
    const health = await healthMonitor.performHealthCheck();
    
    const statusCode = health.overall_status === 'healthy' ? 200 :
                       health.overall_status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      overall_status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /admin/stats
 * System statistics and metrics
 */
router.get("/admin/stats", async (req, res) => {
  try {
    const [metrics, cacheStats] = await Promise.all([
      healthMonitor.getSystemMetrics(),
      Promise.resolve(queryCache.getStats())
    ]);

    res.json({
      success: true,
      data: {
        system: metrics,
        cache: cacheStats,
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage()
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
 * POST /admin/ingest
 * Trigger data ingestion for symbols
 * Body: { "symbols": ["TCS", "INFY", "WIPRO"] }
 */
router.post("/admin/ingest", async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: "symbols array is required"
      });
    }

    const result = await dataIngestion.ingestFundamentals(symbols);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/update-fundamentals
 * Update fundamentals for existing companies
 * Body: { "limit": 10 }
 */
router.post("/admin/update-fundamentals", async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    
    const result = await dataIngestion.updateFundamentals(limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/calculate-metrics
 * Recalculate derived metrics (Debt/FCF, etc.)
 */
router.post("/admin/calculate-metrics", async (req, res) => {
  try {
    await dataIngestion.calculateDerivedMetrics();
    
    res.json({
      success: true,
      message: "Derived metrics calculated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
