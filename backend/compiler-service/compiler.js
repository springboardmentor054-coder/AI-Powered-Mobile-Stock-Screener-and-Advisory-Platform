const express = require("express");
const router = express.Router();

/**
 * POST /compile
 * Input: DSL
 * Output: SQL
 */
router.post("/", (req, res) => {
  const { filters } = req.body;

  if (!filters || !filters.length) {
    return res.json({ error: "No filters" });
  }

  const where = filters
    .map(f => `${f.field} ${f.op} ${f.value}`)
    .join(" AND ");

  const sql = `SELECT * FROM stocks WHERE ${where};`;

  res.json({ sql });
});

module.exports = router;
