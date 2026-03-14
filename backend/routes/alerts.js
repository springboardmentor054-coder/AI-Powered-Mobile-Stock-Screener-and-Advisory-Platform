const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/authMiddleware');
const { generateAlertsForUser, createTestAlert } = require('../services/alertService');

const router = express.Router();

/**
 * GET /api/alerts - Get all alerts for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 200, offset = 0, unreadOnly = 'false' } = req.query;

    let query = `
      SELECT 
        a.*,
        s.company_name,
        s.sector
      FROM wishlist_alerts a
      LEFT JOIN stocks s ON a.symbol = s.symbol
      WHERE a.user_id = $1
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ` AND a.is_read = FALSE`;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/unread-count - Get count of unread alerts
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM wishlist_alerts
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);

    res.json({
      success: true,
      unreadCount: parseInt(result.rows[0].unread_count)
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

/**
 * PUT /api/alerts/:id/read - Mark an alert as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    const result = await pool.query(`
      UPDATE wishlist_alerts
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read',
      error: error.message
    });
  }
});

/**
 * PUT /api/alerts/mark-all-read - Mark all alerts as read
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      UPDATE wishlist_alerts
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING id
    `, [userId]);

    res.json({
      success: true,
      message: `Marked ${result.rows.length} alerts as read`,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alerts as read',
      error: error.message
    });
  }
});

/**
 * DELETE /api/alerts/:id - Delete a specific alert
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    const result = await pool.query(`
      DELETE FROM wishlist_alerts
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    });
  }
});

/**
 * DELETE /api/alerts - Delete all alerts for user
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      DELETE FROM wishlist_alerts
      WHERE user_id = $1
      RETURNING id
    `, [userId]);

    res.json({
      success: true,
      message: `Deleted ${result.rows.length} alerts`,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error deleting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alerts',
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/generate - Manually trigger alert generation
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const alertCount = await generateAlertsForUser(userId);

    res.json({
      success: true,
      message: `Generated ${alertCount} new alerts`,
      alertsGenerated: alertCount
    });

  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate alerts',
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/test - Create a test alert (for development)
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol = 'AAPL' } = req.body;

    await createTestAlert(userId, symbol);

    res.json({
      success: true,
      message: 'Test alert created successfully'
    });

  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test alert',
      error: error.message
    });
  }
});

module.exports = router;
