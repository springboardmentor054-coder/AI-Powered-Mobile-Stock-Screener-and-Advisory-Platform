// backend/routes/screener.routes.js
const express = require("express");
const router = express.Router();
const screenerController = require("../controllers/screener.controller");

/**
 * POST /screener/query
 * Body: { "query": "IT sector stocks with PE less than 20" }
 */
router.post("/query", screenerController.runScreener);

module.exports = router;