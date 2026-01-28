const router = require('express').Router();
const fetchDummyStocks = require('../utils/alphaVantageService');

// Insert all dummy companies
router.post('/fetch-dummy', async (req, res) => {
  try {
    await fetchDummyStocks();
    res.json({ message: 'All dummy stocks inserted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
