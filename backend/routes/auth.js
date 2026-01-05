const router = require('express').Router();
const authController = require('../controllers/authController');

// Routes now just point to the function name
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;