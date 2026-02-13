const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const healthMonitor = require("./services/healthMonitor.service");
const backgroundEvaluator = require("./services/backgroundEvaluator.service");
const logger = require("./utils/logger");
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const disableRateLimit = process.env.DISABLE_RATE_LIMIT === "true";

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Request limit exceeded. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes unless explicitly disabled for controlled load tests.
if (!disableRateLimit) {
  app.use(limiter);
} else {
  logger.warn(logger.LOG_CATEGORIES.SYSTEM, "Rate limiting disabled via DISABLE_RATE_LIMIT");
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(logger.LOG_CATEGORIES.API, `${req.method} ${req.path}`, {
      status: res.statusCode,
      duration_ms: duration
    });
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
app.use("/api/portfolio", require("./routes/portfolio.routes"));
app.use("/api/watchlist", require("./routes/watchlist.routes")); // Watchlist
app.use("/api/alerts", require("./routes/alerts.routes"));
app.use("/api/screeners", require("./routes/screeners.routes")); // NEW: Saved Screeners
app.use("/api/suggestions", require("./routes/suggestions.routes")); // Query suggestions
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// Start health monitoring
healthMonitor.startPeriodicMonitoring(60);

// Start background evaluation (every 1 hour by default)
// Can be configured via EVALUATION_INTERVAL_MS environment variable
backgroundEvaluator.start();

// Global error handler
app.use((err, req, res, next) => {
  logger.error(logger.LOG_CATEGORIES.SYSTEM, 'Unhandled error', { error: err.message });
  res.status(500).json({
    status: 'error',
    timestamp: new Date().toISOString(),
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    timestamp: new Date().toISOString(),
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: 'The requested endpoint does not exist',
      path: req.path
    }
  });
});

module.exports = app;
