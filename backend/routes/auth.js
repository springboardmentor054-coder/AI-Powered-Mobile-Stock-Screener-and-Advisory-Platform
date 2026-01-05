const router = require('express').Router();
const authController = require('../controllers/authController');
const { registerRules, loginRules, validate } = require('../middleware/validateAuth');
// Routes now just point to the function name
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;