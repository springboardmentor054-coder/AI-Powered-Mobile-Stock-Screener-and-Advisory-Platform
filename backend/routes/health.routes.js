// backend/routes/health.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "OK",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "DOWN",
      database: "disconnected",
    });
  }
});

module.exports = router;