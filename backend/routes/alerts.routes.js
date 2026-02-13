/**
 * Alert Management Routes
 * REST API endpoints for alert operations
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/alert.service');
const db = require('../database');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

function buildAlertTitle(symbol, alertType, targetPrice) {
  const upperSymbol = String(symbol || '').toUpperCase();
  const safeType = String(alertType || '').toLowerCase();
  const hasTarget = typeof targetPrice === 'number' && Number.isFinite(targetPrice);

  if (safeType.includes('below')) {
    return hasTarget
      ? `Price alert: ${upperSymbol} below ${targetPrice}`
      : `Price alert: ${upperSymbol} moved lower`;
  }

  if (safeType.includes('above')) {
    return hasTarget
      ? `Price alert: ${upperSymbol} above ${targetPrice}`
      : `Price alert: ${upperSymbol} moved higher`;
  }

  if (safeType.includes('target')) {
    return hasTarget
      ? `Price target: ${upperSymbol} at ${targetPrice}`
      : `Price target update: ${upperSymbol}`;
  }

  return `Alert: ${upperSymbol}`;
}

function buildAlertDescription(symbol, alertType, targetPrice) {
  const upperSymbol = String(symbol || '').toUpperCase();
  const safeType = String(alertType || '').toLowerCase();
  const hasTarget = typeof targetPrice === 'number' && Number.isFinite(targetPrice);

  if (safeType.includes('below') && hasTarget) {
    return `${upperSymbol} crossed below ${targetPrice}.`;
  }

  if (safeType.includes('above') && hasTarget) {
    return `${upperSymbol} crossed above ${targetPrice}.`;
  }

  if (safeType.includes('target') && hasTarget) {
    return `${upperSymbol} reached target level ${targetPrice}.`;
  }

  return `${upperSymbol} triggered a ${alertType} condition.`;
}

/**
 * @route   GET /api/alerts/:userId
 * @desc    Get user's alerts
 * @access  Public
 */
router.get('/:userId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadOnly = req.query.unreadOnly === 'true';

    console.log(`[Alerts] Fetching alerts for user: ${userId} (unread only: ${unreadOnly})`);
    const alerts = await alertService.getUserAlerts(parseInt(userId), unreadOnly);

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        alerts,
        total_count: alerts.length
      }
    });
  } catch (error) {
    console.error('[Alerts] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/alerts/:userId/stats
 * @desc    Get alert statistics for user
 * @access  Public
 */
router.get('/:userId/stats', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Alerts] Fetching stats for user: ${userId}`);
    const stats = await alertService.getAlertStats(parseInt(userId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Alerts] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerts
 * @desc    Create a simplified alert from mobile/web clients
 * @access  Public
 */
router.post('/', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().notEmpty().withMessage('Symbol required'),
  body('alertType').isString().trim().notEmpty().withMessage('Alert type required'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('targetPrice').optional().isFloat({ min: 0.0001 }).withMessage('targetPrice must be positive')
], validate, async (req, res) => {
  try {
    const {
      userId,
      symbol,
      alertType,
      severity = 'medium',
      targetPrice
    } = req.body;

    const companyResult = await db.query(
      'SELECT id, symbol FROM companies WHERE UPPER(symbol) = UPPER($1) LIMIT 1',
      [symbol]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
        message: `Symbol ${symbol} not found`
      });
    }

    const companyId = companyResult.rows[0].id;
    const normalizedSymbol = companyResult.rows[0].symbol;

    const parsedTarget = targetPrice !== undefined ? Number(targetPrice) : null;
    const title = buildAlertTitle(normalizedSymbol, alertType, parsedTarget);
    const description = buildAlertDescription(normalizedSymbol, alertType, parsedTarget);

    const alert = await alertService.createAlert({
      userId: parseInt(userId, 10),
      companyId,
      alertType,
      severity,
      title,
      description,
      previousValue: parsedTarget !== null ? { price: parsedTarget } : null,
      currentValue: null,
      metadata: {
        source: 'client_simplified',
        symbol: normalizedSymbol,
        target_price: parsedTarget
      }
    });

    res.status(alert.suppressed ? 200 : 201).json({
      success: true,
      message: alert.suppressed ? 'Alert suppressed by cooldown' : 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('[Alerts] Simplified create error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerts/create
 * @desc    Create a new alert (typically called by evaluation engine)
 * @access  Public
 */
router.post('/create', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('companyId').isInt({ min: 1 }).withMessage('Valid company ID required'),
  body('alertType').isString().trim().notEmpty().withMessage('Alert type required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('title').isString().trim().notEmpty().withMessage('Title required'),
  body('description').isString().trim().notEmpty().withMessage('Description required'),
  body('previousValue').optional(),
  body('currentValue').optional(),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], validate, async (req, res) => {
  try {
    const alertData = req.body;

    console.log(`[Alerts] Creating alert: ${alertData.title}`);
    const alert = await alertService.createAlert(alertData);

    if (alert.suppressed) {
      res.status(200).json({
        success: true,
        suppressed: true,
        message: 'Alert suppressed due to cooldown period',
        data: alert
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: alert
      });
    }
  } catch (error) {
    console.error('[Alerts] Create error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/alerts/:alertId/read
 * @desc    Mark alert as read
 * @access  Public
 */
router.patch('/:alertId/read', [
  param('alertId').isInt({ min: 1 }).withMessage('Valid alert ID required'),
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    console.log(`[Alerts] Marking alert ${alertId} as read for user ${userId}`);
    const alert = await alertService.markAsRead(parseInt(alertId), userId);

    res.json({
      success: true,
      message: 'Alert marked as read',
      data: alert
    });
  } catch (error) {
    console.error('[Alerts] Mark as read error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to mark alert as read',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/alerts/:alertId/acknowledge
 * @desc    Acknowledge an alert (REST-friendly alias)
 * @access  Public
 */
router.patch('/:alertId/acknowledge', [
  param('alertId').isInt({ min: 1 }).withMessage('Valid alert ID required'),
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    const alert = await alertService.acknowledgeAlert(parseInt(alertId, 10), parseInt(userId, 10));

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert
    });
  } catch (error) {
    console.error('[Alerts] Acknowledge alias error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/alerts/:userId/read-all
 * @desc    Mark all active alerts as read for a user
 * @access  Public
 */
router.patch('/:userId/read-all', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `UPDATE alerts
       SET read = true
       WHERE user_id = $1
         AND active = true
         AND (expires_at IS NULL OR expires_at > NOW())
       RETURNING id`,
      [parseInt(userId, 10)]
    );

    res.json({
      success: true,
      message: 'All alerts marked as read',
      data: {
        updated_count: result.rowCount
      }
    });
  } catch (error) {
    console.error('[Alerts] Read-all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all alerts as read',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/alerts/:alertId/dismiss
 * @desc    Dismiss/deactivate an alert
 * @access  Public
 */
router.patch('/:alertId/dismiss', [
  param('alertId').isInt({ min: 1 }).withMessage('Valid alert ID required'),
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    console.log(`[Alerts] Dismissing alert ${alertId} for user ${userId}`);
    const alert = await alertService.dismissAlert(parseInt(alertId), userId);

    res.json({
      success: true,
      message: 'Alert dismissed',
      data: alert
    });
  } catch (error) {
    console.error('[Alerts] Dismiss error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to dismiss alert',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerts/acknowledge
 * @desc    Acknowledge an alert
 * @access  Public
 */
router.post('/acknowledge', [
  body('alert_id').isInt({ min: 1 }).withMessage('Valid alert ID required'),
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { alert_id, userId } = req.body;

    console.log(`[Alerts] Acknowledging alert ${alert_id} for user ${userId}`);
    const alert = await alertService.acknowledgeAlert(parseInt(alert_id), userId);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert
    });
  } catch (error) {
    console.error('[Alerts] Acknowledge error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/alerts/:userId/pending
 * @desc    Get pending (undelivered) alerts for user
 * @access  Public
 */
router.get('/:userId/pending', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Alerts] Fetching pending alerts for user: ${userId}`);
    const alerts = await alertService.getPendingAlerts(parseInt(userId));

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        pending_alerts: alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    console.error('[Alerts] Get pending alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending alerts',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/alerts/:userId/digest
 * @desc    Get daily digest for user
 * @access  Public
 */
router.get('/:userId/digest', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Alerts] Creating daily digest for user: ${userId}`);
    const result = await alertService.createDailyDigest(parseInt(userId));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Alerts] Create digest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create digest',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerts/:userId/process-pending
 * @desc    Process all pending alerts for user (batch notification)
 * @access  Public
 */
router.post('/:userId/process-pending', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Alerts] Processing pending alerts for user: ${userId}`);
    const result = await alertService.processPendingAlerts(parseInt(userId));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Alerts] Process pending alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process pending alerts',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/alerts/:alertId
 * @desc    Soft-delete alert by marking inactive
 * @access  Public
 */
router.delete('/:alertId', [
  param('alertId').isInt({ min: 1 }).withMessage('Valid alert ID required'),
  query('userId').optional().isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('userId').optional().isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userIdRaw = req.query.userId ?? req.body.userId;

    if (!userIdRaw) {
      return res.status(400).json({
        success: false,
        error: 'userId is required for alert deletion'
      });
    }

    const userId = parseInt(userIdRaw, 10);

    const result = await db.query(
      `UPDATE alerts SET active = false WHERE id = $1 AND user_id = $2 RETURNING id`,
      [parseInt(alertId, 10), userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted'
    });
  } catch (error) {
    console.error('[Alerts] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/alerts/:userId/dismissed
 * @desc    Clear dismissed/inactive alerts for a user
 * @access  Public
 */
router.delete('/:userId/dismissed', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `DELETE FROM alerts WHERE user_id = $1 AND active = false RETURNING id`,
      [parseInt(userId, 10)]
    );

    res.json({
      success: true,
      message: 'Dismissed alerts cleared',
      data: {
        deleted_count: result.rowCount
      }
    });
  } catch (error) {
    console.error('[Alerts] Clear dismissed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear dismissed alerts',
      message: error.message
    });
  }
});

module.exports = router;
