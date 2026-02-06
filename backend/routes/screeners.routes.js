/**
 * Saved Screeners Routes
 * REST API endpoints for managing saved screeners
 */

const express = require('express');
const router = express.Router();
const savedScreenersService = require('../services/savedScreeners.service');
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
 * @route   POST /api/screeners
 * @desc    Save a new screener
 * @access  Public
 */
router.post('/', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('name').isString().trim().notEmpty().withMessage('Screener name required'),
  body('description').optional().isString(),
  body('dslQuery').isObject().withMessage('DSL query must be an object'),
  body('notificationEnabled').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const screener = await savedScreenersService.saveScreener(req.body);

    res.status(201).json({
      success: true,
      message: 'Screener saved successfully',
      data: screener
    });
  } catch (error) {
    console.error('[Screeners] Save error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to save screener',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/screeners/:userId
 * @desc    Get all saved screeners for a user
 * @access  Public
 */
router.get('/:userId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  query('activeOnly').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    const screeners = await savedScreenersService.getUserScreeners(parseInt(userId), activeOnly);

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        screeners,
        count: screeners.length
      }
    });
  } catch (error) {
    console.error('[Screeners] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screeners',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/screeners/:userId/stats
 * @desc    Get screener statistics for user
 * @access  Public
 */
router.get('/:userId/stats', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await savedScreenersService.getScreenerStats(parseInt(userId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Screeners] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screener statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/screeners/:userId/:screenerId
 * @desc    Get a specific screener
 * @access  Public
 */
router.get('/:userId/:screenerId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  param('screenerId').isInt({ min: 1 }).withMessage('Valid screener ID required')
], validate, async (req, res) => {
  try {
    const { userId, screenerId } = req.params;
    const screener = await savedScreenersService.getScreenerById(
      parseInt(screenerId),
      parseInt(userId)
    );

    res.json({
      success: true,
      data: screener
    });
  } catch (error) {
    console.error('[Screeners] Get by ID error:', error);
    res.status(404).json({
      success: false,
      error: 'Screener not found',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/screeners/:userId/:screenerId
 * @desc    Update a saved screener
 * @access  Public
 */
router.patch('/:userId/:screenerId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  param('screenerId').isInt({ min: 1 }).withMessage('Valid screener ID required'),
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString(),
  body('dslQuery').optional().isObject(),
  body('notificationEnabled').optional().isBoolean(),
  body('active').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const { userId, screenerId } = req.params;
    const screener = await savedScreenersService.updateScreener(
      parseInt(screenerId),
      parseInt(userId),
      req.body
    );

    res.json({
      success: true,
      message: 'Screener updated successfully',
      data: screener
    });
  } catch (error) {
    console.error('[Screeners] Update error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update screener',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/screeners/:userId/:screenerId
 * @desc    Delete a saved screener
 * @access  Public
 */
router.delete('/:userId/:screenerId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  param('screenerId').isInt({ min: 1 }).withMessage('Valid screener ID required')
], validate, async (req, res) => {
  try {
    const { userId, screenerId } = req.params;
    const result = await savedScreenersService.deleteScreener(
      parseInt(screenerId),
      parseInt(userId)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Screeners] Delete error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to delete screener',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/screeners/:userId/:screenerId/notifications
 * @desc    Toggle notifications for a screener
 * @access  Public
 */
router.patch('/:userId/:screenerId/notifications', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  param('screenerId').isInt({ min: 1 }).withMessage('Valid screener ID required'),
  body('enabled').isBoolean().withMessage('Enabled status required')
], validate, async (req, res) => {
  try {
    const { userId, screenerId } = req.params;
    const { enabled } = req.body;

    const screener = await savedScreenersService.toggleNotifications(
      parseInt(screenerId),
      parseInt(userId),
      enabled
    );

    res.json({
      success: true,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
      data: screener
    });
  } catch (error) {
    console.error('[Screeners] Toggle notifications error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to toggle notifications',
      message: error.message
    });
  }
});

module.exports = router;
