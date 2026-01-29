const parseQuery = require("../services/llmParser.service");
const compileDSL = require("../services/screenerCompiler.service");
const pool = require("../config/db");

exports.runScreener = async (req, res) => {
  try {
    const { query } = req.body;

    const dsl = await parseQuery(query);
    const sql = compileDSL(dsl);
    const result = await pool.query(sql);

    res.json({
      dsl,
      sql,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("Screener error:", err);
    res.status(500).json({ error: err.message });
  }
};