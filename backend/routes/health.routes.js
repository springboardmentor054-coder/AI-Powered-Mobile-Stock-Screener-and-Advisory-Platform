/**
 * Health and Admin Routes
 * Production-ready health monitoring and admin endpoints
 */

const express = require("express");
const router = express.Router();
const healthMonitor = require("../services/healthMonitor.service");
const queryCache = require("../services/queryCache.service");
const finnhubService = require("../services/finnhub.service");

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
 * DEPRECATED: No longer needed - using real-time Finnhub API
 * Data is fetched on-demand with caching, no batch ingestion required
 * 
 * Legacy: Was used to load fundamentals from Alpha Vantage
 * Current: All market data comes from Finnhub in real-time
 */
router.post("/admin/ingest", async (req, res) => {
  res.status(410).json({
    success: false,
    error: "Deprecated endpoint",
    message: "Batch data ingestion is no longer used. All data is fetched real-time from Finnhub API.",
    migration_info: {
      old_system: "Batch load from Alpha Vantage → Database",
      new_system: "Real-time Finnhub API → Cache → Client",
      benefits: [
        "Always current data (15-minute delay vs days)",
        "Reduced database load",
        "Single source of truth",
        "Automatic fallback to mock data if API unavailable"
      ]
    }
  });
});

/**
 * POST /admin/update-fundamentals
 * DEPRECATED: No longer needed - fundamentals updated in real-time from Finnhub
 */
router.post("/admin/update-fundamentals", async (req, res) => {
  res.status(410).json({
    success: false,
    error: "Deprecated endpoint",
    message: "Fundamentals are now fetched real-time from Finnhub API.",
    status: {
      finnhub_api_configured: !!process.env.FINNHUB_API_KEY,
      cache_status: finnhubService.getStatus()
    }
  });
});

/**
 * POST /admin/calculate-metrics
 * DEPRECATED: No longer needed - metrics calculated on-demand
 */
router.post("/admin/calculate-metrics", async (req, res) => {
  res.status(410).json({
    success: false,
    error: "Deprecated endpoint",
    message: "Derived metrics are now calculated in real-time on API response."
  });
});

module.exports = router;
