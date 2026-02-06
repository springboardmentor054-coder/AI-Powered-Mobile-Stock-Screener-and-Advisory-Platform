/**
 * Portfolio Management Routes
 * REST API endpoints for user portfolio operations
 */

const express = require('express');
const router = express.Router();
const portfolioService = require('../services/portfolio.service');
const { body, param, validationResult } = require('express-validator');

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
 * @route   GET /api/portfolio/:userId
 * @desc    Get user's portfolio
 * @access  Public
 */
router.get('/:userId', [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID required')
], validate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[Portfolio] Fetching portfolio for user: ${userId}`);
    const portfolio = await portfolioService.listPortfolio(parseInt(userId));

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        ...portfolio
      }
    });
  } catch (error) {
    console.error('[Portfolio]List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/portfolio/add
 * @desc    Add stock to portfolio
 * @access  Public
 * @body    { userId, symbol, quantity, avgPrice }
 */
router.post('/add', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid stock symbol required'),
  body('quantity').isFloat({ min: 0.0001 }).withMessage('Quantity must be greater than 0'),
  body('avgPrice').isFloat({ min: 0.01 }).withMessage('Average price must be greater than 0')
], validate, async (req, res) => {
  try {
    const { userId, symbol, quantity, avgPrice } = req.body;

    console.log(`[Portfolio] Adding stock: ${symbol} for user: ${userId}`);
    const result = await portfolioService.addStock(
      userId,
      symbol,
      parseFloat(quantity),
      parseFloat(avgPrice)
    );

    res.status(201).json({
      success: true,
      message: `Successfully added ${symbol} to portfolio`,
      data: result
    });
  } catch (error) {
    console.error('[Portfolio] Add error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to add stock to portfolio',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/portfolio/remove
 * @desc    Remove stock from portfolio
 * @access  Public
 * @body    { userId, symbol }
 */
router.delete('/remove', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid stock symbol required')
], validate, async (req, res) => {
  try {
    const { userId, symbol } = req.body;

    console.log(`[Portfolio] Removing stock: ${symbol} for user: ${userId}`);
    const result = await portfolioService.removeStock(userId, symbol);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Portfolio] Remove error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to remove stock from portfolio',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/portfolio/update
 * @desc    Update portfolio item
 * @access  Public
 * @body    { userId, symbol, quantity, avgPrice }
 */
router.put('/update', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID required'),
  body('symbol').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Valid stock symbol required'),
  body('quantity').isFloat({ min: 0.0001 }).withMessage('Quantity must be greater than 0'),
  body('avgPrice').isFloat({ min: 0.01 }).withMessage('Average price must be greater than 0')
], validate, async (req, res) => {
  try {
    const { userId, symbol, quantity, avgPrice } = req.body;

    console.log(`[Portfolio] Updating stock: ${symbol} for user: ${userId}`);
    const result = await portfolioService.updateStock(
      userId,
      symbol,
      parseFloat(quantity),
      parseFloat(avgPrice)
    );

    res.json({
      success: true,
      message: `Successfully updated ${symbol} in portfolio`,
      data: result
    });
  } catch (error) {
    console.error('[Portfolio] Update error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update portfolio item',
      message: error.message
    });
  }
});

module.exports = router;
