const express = require("express");
const { parseQueryToDSL } = require("../services/llmParser");
const { compileDSLToSQL } = require("../services/screenerCompiler");

const router = express.Router();

router.post("/run", (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: "Query required" });
  }

  const dsl = parseQueryToDSL(query);
  const sql = compileDSLToSQL(dsl);

  res.json({
    userQuery: query,
    parsedDSL: dsl,
    generatedSQL: sql,
    note: "SQL execution will be enabled in next sprint"
  });
});

module.exports = router;
