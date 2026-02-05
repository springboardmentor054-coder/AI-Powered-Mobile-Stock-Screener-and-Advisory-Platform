const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth').authenticate;
const { createAlert, getNotifications, markNotificationRead, deleteNotification, getAlertsForStock, reactivateAlert, deleteAlert, getAllUserAlerts } = require('../controllers/alertController');


// All routes require login
router.post('/create', authenticate, createAlert);
router.get('/notifications', authenticate, getNotifications);

router.get('/all', authenticate, getAllUserAlerts);

router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.delete('/notifications/:id', authenticate, deleteNotification);

router.get('/stock/:ticker', authenticate, getAlertsForStock);
router.put('/:id/reactivate', authenticate, reactivateAlert);
router.delete('/:id', authenticate, deleteAlert);

module.exports = router;