/**
 * Alert Management Routes
 * REST API endpoints for alert operations
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/alert.service');
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

module.exports = router;
