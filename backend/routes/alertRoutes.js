const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth').authenticate;
const { createAlert, getNotifications } = require('../controllers/alertController');

// All routes require login
router.post('/create', authenticate, createAlert);
router.get('/notifications', authenticate, getNotifications);

module.exports = router;