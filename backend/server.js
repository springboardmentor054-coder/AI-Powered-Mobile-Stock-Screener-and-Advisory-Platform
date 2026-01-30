const express = require('express');
const cors = require('cors');  // must be here
const pool = require('./db');
const parseQuery = require('./llmParser');
const compile = require('./compiler');

const app = express();
app.use(cors());             // allow requests from frontend
app.use(express.json());


app.post('/screener', async (req, res) => {
  try {
    const sql = `
  SELECT 
    symbol,
    company_name,
    peg_ratio,
    current_price,
    NULL as target_price
  FROM stocks
  WHERE
    sector = 'IT'
    AND peg_ratio < 3
    AND promoter_holding > 50
  `;



    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
