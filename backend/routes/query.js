const router = require('express').Router();
const { authenticate } = require('../middleware/auth'); // JWT middleware from Step 1
const { handleUserQuery } = require('../controllers/screenerController'); // same controller

// Route to accept user queries
router.post('/query', authenticate, handleUserQuery);

module.exports = router;
