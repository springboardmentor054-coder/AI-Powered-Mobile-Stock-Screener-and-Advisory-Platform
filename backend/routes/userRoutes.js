const express = require('express');
const router = express.Router();
const { getDashboard, addToWatchlist, removeFromWatchlist } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes require login
router.get('/dashboard', authenticate, getDashboard);
router.post('/watchlist/add', authenticate, addToWatchlist);
router.post('/watchlist/remove', authenticate, removeFromWatchlist);

module.exports = router;