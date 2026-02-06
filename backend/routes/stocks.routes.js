const express = require("express");
const router = express.Router();

const {
  getStocks,
} = require("../controllers/stocks.controller");

// REMOVED: Alpha Vantage fetch endpoint (deprecated - Yahoo Finance is primary data source)
// router.post("/fetch", fetchAndStoreStock);

router.get("/", getStocks);

module.exports = router;
