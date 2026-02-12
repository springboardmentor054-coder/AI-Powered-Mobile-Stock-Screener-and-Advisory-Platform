const express = require("express");
const cors = require("cors");
const callParserService = require("./services/callParserService");
const callScreenerEngine = require("./services/callScreenerEngine");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.post("/screener/run", async (req, res) => {
  try {
    const { query } = req.body || {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) is required" });
    }

    const parsed = await callParserService(query);
    if (!parsed || !parsed.dsl) {
      return res.status(400).json({ error: "Parser did not return DSL" });
    }

    const results = await callScreenerEngine(parsed.dsl);

    return res.json({
      query,
      dsl: parsed.dsl,
      results
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error || err.message || "Gateway failed";
    return res.status(status).json({ error: message });
  }
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`API Gateway running on ${PORT}`);
});
