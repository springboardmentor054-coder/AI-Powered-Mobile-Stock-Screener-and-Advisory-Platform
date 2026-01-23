const express = require('express');
const { parseQuery } = require('./parser');
const { compileDSL } = require('./compiler');
const { runSQL } = require('./runner');

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  try {
    const { query } = req.body;

    const dsl = parseQuery(query);
    const sql = compileDSL(dsl);
    const result = await runSQL(sql);

    return res.json({ dsl, sql, result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(4001, () => console.log("Screener Engine running on 4001"));
