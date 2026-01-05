const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  res.json([
    { symbol: "INFY", company: "Infosys" },
    { symbol: "TCS", company: "Tata Consultancy Services" }
  ]);
});

module.exports = router;