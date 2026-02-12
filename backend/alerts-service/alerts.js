const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { symbol, value, threshold } = req.body;

  if (value < threshold) {
    console.log(`Alert triggered: ${symbol}`);
  }

  res.json({ status: "Checked" });
});

module.exports = router;
