require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { startScheduler, triggerManualUpdate } = require("./scripts/scheduler");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const stockRoutes = require("./routes/stocks");
const screenerRoutes = require("./routes/screener");
const wishlistRoutes = require("./routes/wishlist");
const pricesRoutes = require("./routes/prices");

const app = express();

// Enhanced CORS configuration for Flutter web
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

// Admin endpoint to check data status
app.get("/api/admin/data-status", async (req, res) => {
  try {
    const db = require("./config/database");
    
    const fundamentalsUpdate = await db.query(`
      SELECT MAX(updated_at) as last_update, COUNT(*) as total_records 
      FROM fundamentals
    `);
    
    const recentData = await db.query(`
      SELECT COUNT(*) as recent_count 
      FROM fundamentals 
      WHERE updated_at >= NOW() - INTERVAL '7 days'
    `);
    
    const stocksCount = await db.query(`SELECT COUNT(*) as total FROM stocks WHERE is_active = TRUE`);
    
    const lastUpdate = fundamentalsUpdate.rows[0].last_update;
    let status = 'unknown';
    let daysSinceUpdate = null;
    
    if (lastUpdate) {
      const now = new Date();
      const lastUpdateDate = new Date(lastUpdate);
      const hoursSince = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60));
      daysSinceUpdate = Math.floor(hoursSince / 24);
      
      if (daysSinceUpdate === 0) {
        status = 'up-to-date';
      } else if (daysSinceUpdate === 1) {
        status = 'recent';
      } else {
        status = 'stale';
      }
    }
    
    res.json({
      scheduler: {
        enabled: process.env.ENABLE_SCHEDULER === 'true',
        schedule: 'Daily at 6:00 AM',
        nextRun: '6:00 AM tomorrow'
      },
      data: {
        lastUpdate: lastUpdate,
        status: status,
        daysSinceUpdate: daysSinceUpdate,
        fundamentals: {
          totalRecords: fundamentalsUpdate.rows[0].total_records,
          recentlyUpdated: recentData.rows[0].recent_count
        },
        activeStocks: stocksCount.rows[0].total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint to manually trigger data update
app.post("/api/admin/trigger-update", async (req, res) => {
  res.json({ 
    message: "Data update triggered. Check server logs for progress.",
    note: "This will take several minutes to complete."
  });
  
  // Run update in background
  triggerManualUpdate().catch(err => {
    console.error("Manual update error:", err);
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/screener", screenerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/prices", pricesRoutes);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Alpha Vantage API Key: ${process.env.ALPHA_VANTAGE_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`Database: ${process.env.DB_NAME || 'Not configured'}`);
  
  // Start daily update scheduler
  if (process.env.ENABLE_SCHEDULER === 'true') {
    startScheduler();
  } else {
    console.log(`Scheduler: Disabled (set ENABLE_SCHEDULER=true to enable)`);
  }
});

