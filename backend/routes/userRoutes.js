const express = require('express');
const router = express.Router();
const { getWatchlist, getRecentQueries, addToWatchlist, removeFromWatchlist, getSearchStats } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes require login
router.get('/watchlist', authenticate, getWatchlist);
router.get('/recent-queries', authenticate, getRecentQueries);
router.post('/watchlist/add', authenticate, addToWatchlist);
router.post('/watchlist/remove', authenticate, removeFromWatchlist);
router.get('/stats', authenticate, getSearchStats);

module.exports = router;