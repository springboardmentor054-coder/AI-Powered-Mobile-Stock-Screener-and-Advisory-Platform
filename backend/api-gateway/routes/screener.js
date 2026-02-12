const express = require("express");
const router = express.Router();

router.post("/run", (req, res) => {
  const { query } = req.body;

  // Demo screener results
  const companies = [
    { symbol: "IBM", company: "International Business Machines", pe: 28.2 },
    { symbol: "AAPL", company: "Apple Inc", pe: 32.1 },
    { symbol: "MSFT", company: "Microsoft Corporation", pe: 25.7 }
  ];

  const value = parseInt(query.match(/\d+/)?.[0]);

  const filtered = companies.filter(c => c.pe < value);

  res.json(filtered);
});

module.exports = router;
