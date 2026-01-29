const express = require("express");
const cors = require("cors");

const screenerRoutes = require("./routes/screener.routes");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/screener", screenerRoutes);

module.exports = app;