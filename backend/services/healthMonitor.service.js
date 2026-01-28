/**
 * Health Monitoring Service
 * Production-grade system health checks and monitoring
 */

const pool = require("../database");
const cache = require("../cache");
const { groq } = require("../llm");

class HealthMonitorService {
  constructor() {
    this.checks = {
      database: false,
      cache: false,
      llm: false,
      api: true
    };
    this.lastCheck = null;
    this.errors = [];
    this.monitoringInterval = null;
  }

  /**
   * Check PostgreSQL database connectivity
   */
  async checkDatabase() {
    try {
      const result = await pool.query('SELECT NOW()');
      this.checks.database = result.rows.length > 0;
      return {
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: result.rows[0].now
      };
    } catch (error) {
      this.checks.database = false;
      this.errors.push({ component: 'database', error: error.message });
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  /**
   * Check Redis cache connectivity
   */
  async checkCache() {
    try {
      await cache.setEx('health_check', 10, 'OK');
      const value = await cache.get('health_check');
      this.checks.cache = value === 'OK';
      return {
        status: this.checks.cache ? 'healthy' : 'degraded',
        message: this.checks.cache ? 'Cache working' : 'Cache unavailable (non-critical)'
      };
    } catch (error) {
      this.checks.cache = false;
      return {
        status: 'degraded',
        message: 'Cache unavailable (app continues without caching)',
        error: error.message
      };
    }
  }

  /**
   * Check LLM API connectivity
   */
  async checkLLM() {
    try {
      if (!process.env.GROQ_API_KEY) {
        this.checks.llm = false;
        return {
          status: 'unhealthy',
          message: 'GROQ_API_KEY not configured'
        };
      }

      this.checks.llm = true;
      return {
        status: 'healthy',
        message: 'LLM configured',
        model: 'llama-3.3-70b-versatile'
      };
    } catch (error) {
      this.checks.llm = false;
      this.errors.push({ component: 'llm', error: error.message });
      return {
        status: 'unhealthy',
        message: 'LLM check failed',
        error: error.message
      };
    }
  }

  /**
   * Check data freshness
   */
  async checkDataFreshness() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(CASE WHEN f.updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as fresh_data,
          MAX(f.updated_at) as latest_update
        FROM companies c
        LEFT JOIN fundamentals f ON c.symbol = f.symbol
      `);

      const data = result.rows[0];
      const freshnessPercentage = data.total_companies > 0 
        ? (data.fresh_data / data.total_companies * 100).toFixed(1)
        : 0;

      return {
        status: freshnessPercentage > 50 ? 'healthy' : 'degraded',
        message: `${freshnessPercentage}% of data updated in last 7 days`,
        total_companies: parseInt(data.total_companies),
        fresh_data: parseInt(data.fresh_data),
        latest_update: data.latest_update
      };
    } catch (error) {
      return {
        status: 'unknown',
        message: 'Could not check data freshness',
        error: error.message
      };
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    try {
      const dbStats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM companies) as total_companies,
          (SELECT COUNT(*) FROM fundamentals) as total_fundamentals,
          (SELECT COUNT(DISTINCT sector) FROM companies) as unique_sectors,
          (SELECT pg_database_size(current_database())) as db_size
      `);

      return {
        companies: parseInt(dbStats.rows[0].total_companies),
        fundamentals: parseInt(dbStats.rows[0].total_fundamentals),
        sectors: parseInt(dbStats.rows[0].unique_sectors),
        database_size_mb: Math.round(dbStats.rows[0].db_size / 1024 / 1024)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Comprehensive health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing health check...');

    const results = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      components: {},
      metrics: null
    };

    // Run all checks in parallel
    const [dbHealth, cacheHealth, llmHealth, dataHealth, metrics] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkLLM(),
      this.checkDataFreshness(),
      this.getSystemMetrics()
    ]);

    results.components = {
      database: dbHealth,
      cache: cacheHealth,
      llm: llmHealth,
      data_freshness: dataHealth
    };

    results.metrics = metrics;

    // Determine overall status
    if (!this.checks.database || !this.checks.llm) {
      results.overall_status = 'unhealthy';
    } else if (!this.checks.cache) {
      results.overall_status = 'degraded';
    }

    this.lastCheck = results;
    return results;
  }

  /**
   * Get quick health status
   */
  getQuickHealth() {
    if (!this.lastCheck || 
        (new Date() - new Date(this.lastCheck.timestamp)) > 60000) {
      // Cache expired, return basic status
      return {
        status: 'unknown',
        message: 'Health check not performed recently',
        database: this.checks.database ? 'connected' : 'unknown',
        llm: this.checks.llm ? 'configured' : 'unknown'
      };
    }

    return {
      status: this.lastCheck.overall_status,
      database: this.checks.database ? 'connected' : 'disconnected',
      llm: this.checks.llm ? 'configured' : 'not configured',
      cache: this.checks.cache ? 'available' : 'unavailable',
      last_check: this.lastCheck.timestamp
    };
  }

  /**
   * Start periodic health monitoring
   */
  startPeriodicMonitoring(intervalSeconds = 60) {
    console.log(`⏰ Starting health monitoring (every ${intervalSeconds}s)`);

    // Initial check
    this.performHealthCheck().catch(err => {
      console.error('Initial health check failed:', err);
    });

    // Clear existing interval if any
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck().catch(err => {
        console.error('Periodic health check failed:', err);
      });
    }, intervalSeconds * 1000);
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏰ Health monitoring stopped');
    }
  }
}

module.exports = new HealthMonitorService();
