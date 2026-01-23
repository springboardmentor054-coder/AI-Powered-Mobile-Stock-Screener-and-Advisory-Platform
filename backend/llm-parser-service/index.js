const express = require("express");
const cors = require("cors");
const compileDSL = require("./compileDSL");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/run", async (req, res) => {
  try {
    const { dsl } = req.body;
    const sql = compileDSL(dsl);
    const result = await db.query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Screener failed" });
  }
});

app.listen(5002, () => console.log("Screener running on 5002"));
