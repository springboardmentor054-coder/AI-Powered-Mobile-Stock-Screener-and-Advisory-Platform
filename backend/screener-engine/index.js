require("dotenv").config();

const express = require("express");
const { runLiveFilter } = require("./runner");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "screener-engine" });
});

app.post("/run", async (req, res) => {
  try {
    const { dsl } = req.body || {};

    if (!dsl || !Array.isArray(dsl.filters) || !dsl.filters.length) {
      return res.status(400).json({ error: "dsl.filters is required" });
    }

    const result = await runLiveFilter(dsl);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Screener failed" });
  }
});

const PORT = Number(process.env.PORT || 5002);
app.listen(PORT, () => {
  console.log(`Screener Engine running on port ${PORT}`);
});
