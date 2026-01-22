const express = require("express");
const cors = require("cors");
const healthMonitor = require("./services/healthMonitor.service");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use("/stocks", require("./routes/stocks.routes"));
app.use("/", require("./routes/screener"));
app.use("/api", require("./routes/market.routes"));
app.use("/", require("./routes/health.routes"));
app.use("/api/advisory", require("./routes/advisory.routes"));
app.use("/api/insights", require("./routes/insights.routes"));

// Start health monitoring
healthMonitor.startPeriodicMonitoring(60);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

module.exports = app;
