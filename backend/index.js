require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { startScheduler, triggerManualUpdate } = require("./scripts/scheduler");

const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stocks");
const screenerRoutes = require("./routes/screener");
const alphaVantageTestRoutes = require("./routes/alphaVantageTest");
const databaseTestRoutes = require("./routes/databaseTest");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
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

app.use("/auth", authRoutes);
app.use("/stocks", stockRoutes);
app.use("/screener", screenerRoutes);
app.use("/api/test", alphaVantageTestRoutes);
app.use("/api/db-test", databaseTestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Alpha Vantage API Key: ${process.env.ALPHA_VANTAGE_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`Database: ${process.env.DB_NAME || 'Not configured'}`);
  
  // Start daily update scheduler
  if (process.env.ENABLE_SCHEDULER === 'true') {
    startScheduler();
  } else {
    console.log(`Scheduler: Disabled (set ENABLE_SCHEDULER=true to enable)`);
  }
});

