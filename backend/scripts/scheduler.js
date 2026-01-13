const cron = require("node-cron");
const { updateExistingStocks } = require("./populateDatabase");
const db = require("../config/database");

/**
 * Scheduled job to update stock data daily
 * Runs at 6:00 AM every day (after market close)
 */

let isRunning = false;

async function dailyUpdate() {
  if (isRunning) {
    console.log("⏭️  Skipping update - previous job still running");
    return;
  }
  
  isRunning = true;
  const startTime = Date.now();
  
  console.log("\n" + "=".repeat(60));
  console.log(`🔄 DAILY UPDATE STARTED - ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }
    
    // Update all stocks
    const results = await updateExistingStocks();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ DAILY UPDATE COMPLETE");
    console.log("=".repeat(60));
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`✅ Updated: ${successful} stocks`);
    console.log(`❌ Failed: ${failed} stocks`);
    
  } catch (error) {
    console.error("\n❌ Daily update failed:", error.message);
    console.error(error.stack);
  } finally {
    isRunning = false;
  }
}

/**
 * Schedule daily update at 6:00 AM
 * Cron format: "0 6 * * *" = At 06:00 every day
 */
function startScheduler() {
  console.log("\n📅 Starting daily update scheduler...");
  console.log("   Schedule: Every day at 6:00 AM");
  console.log("   Status: Active ✅\n");
  
  // Schedule daily update
  cron.schedule("0 6 * * *", () => {
    dailyUpdate();
  });
  
  // Also allow manual trigger via /api/admin/trigger-update endpoint
  console.log("💡 Tip: You can manually trigger update via:");
  console.log("   POST http://localhost:5000/api/admin/trigger-update\n");
}

/**
 * Manual trigger function (for testing or admin endpoint)
 */
async function triggerManualUpdate() {
  console.log("🔧 Manual update triggered");
  await dailyUpdate();
}

module.exports = {
  startScheduler,
  triggerManualUpdate,
  dailyUpdate
};
