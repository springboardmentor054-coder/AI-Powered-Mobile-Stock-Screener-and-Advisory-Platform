/**
 * Admin & Monitoring Routes
 * System status, statistics, and administrative endpoints
 */

const express = require('express');
const router = express.Router();
const backgroundEvaluator = require('../services/backgroundEvaluator.service');
const auditService = require('../services/audit.service');
const queryCache = require('../services/queryCache.service');
const pool = require('../database');
const dhanImportService = require('../services/dhanImport.service');

/**
 * @route   GET /api/admin/status
 * @desc    Get system status and health
 * @access  Public (should be protected in production)
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      background_evaluator: backgroundEvaluator.getStats(),
      cache: queryCache.getStats(),
      database: await getDatabaseStats(),
      environment: {
        node_version: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development'
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[Admin] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get recent audit logs
 * @access  Public (should be protected in production)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await auditService.getRecentLogs(limit);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    console.error('[Admin] Audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/audit-stats
 * @desc    Get audit statistics
 * @access  Public (should be protected in production)
 */
router.get('/audit-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await auditService.getStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Admin] Audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/admin/evaluation/run
 * @desc    Manually trigger evaluation cycle
 * @access  Public (should be protected in production)
 */
router.post('/evaluation/run', async (req, res) => {
  try {
    console.log('[Admin] Manual evaluation cycle triggered');
    
    // Run in background, return immediately
    backgroundEvaluator.runManual().catch(err => {
      console.error('[Admin] Manual evaluation error:', err);
    });

    res.json({
      success: true,
      message: 'Evaluation cycle started',
      stats: backgroundEvaluator.getStats()
    });
  } catch (error) {
    console.error('[Admin] Evaluation trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger evaluation',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/database-stats
 * @desc    Get database statistics
 * @access  Public (should be protected in production)
 */
router.get('/database-stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Admin] Database stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/admin/dhan/import
 * @desc    Import Dhan CSV data into database
 * @access  Public (should be protected in production)
 */
router.post('/dhan/import', async (req, res) => {
  try {
    const replaceExisting = req.query.replace !== 'false';
    const csvPath = req.body?.csv_path;
    const result = await dhanImportService.importDhanCsv({
      csvPath,
      replaceExisting
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Admin] Dhan import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import Dhan CSV',
      message: error.message
    });
  }
});

/**
 * Helper: Get database statistics
 */
async function getDatabaseStats() {
  try {
    const tables = [
      'users',
      'companies',
      'fundamentals',
      'dhan_stocks',
      'portfolio_items',
      'alerts',
      'condition_evaluations',
      'audit_logs',
      'saved_screeners'
    ];

    const counts = {};
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (err) {
        counts[table] = 'error';
      }
    }

    return {
      table_counts: counts,
      total_records: Object.values(counts).reduce((sum, val) => {
        return typeof val === 'number' ? sum + val : sum;
      }, 0)
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return { error: error.message };
  }
}

module.exports = router;
