const express = require("express");
const cors = require("cors");
const parserRouter = require("./parser");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/parse", parserRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "llm-parser-service" });
});

const PORT = Number(process.env.PORT || 5001);
app.listen(PORT, () => {
  console.log(`Parser service running on ${PORT}`);
});
