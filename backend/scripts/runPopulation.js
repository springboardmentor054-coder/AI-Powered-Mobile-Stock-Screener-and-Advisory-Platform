require("dotenv").config();
const { populateAllStocks, populateCorporateActions, populateEarningsAnalystData } = require("./populateDatabase");
const db = require("../config/database");

/**
 * Main script to populate the database
 * Run with: node scripts/runPopulation.js
 */

async function main() {
  console.log("=" .repeat(60));
  console.log("   AI STOCK SCREENER - DATABASE POPULATION");
  console.log("=".repeat(60));
  console.log("\n⚙️  Configuration:");
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Alpha Vantage Key: ${process.env.ALPHA_VANTAGE_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
  
  // Test database connection
  console.log("\n🔌 Testing database connection...");
  const isConnected = await db.testConnection();
  
  if (!isConnected) {
    console.error("\n❌ Database connection failed!");
    console.error("   Please ensure PostgreSQL is running and .env is configured correctly.");
    process.exit(1);
  }
  
  console.log("✅ Database connection successful!\n");
  
  // Ask user for confirmation
  console.log("⚠️  WARNING:");
  console.log("   - This will populate the database with stocks from multiple sectors");
  console.log("   - Technology (22 stocks), Financial (12), Healthcare (10),");
  console.log("     Consumer (11), Energy (6), Industrial (7), Communication (6)");
  console.log("   - Total: 74 stocks available");
  console.log("   - Each stock takes ~1.5 minutes to process");
  console.log("   - Alpha Vantage rate limits: 5 req/min, 25 req/day");
  console.log("\n💡 TIP: Use --limit=5 for testing or --sector=technology for specific sector\n");
  
  // Get limit from command line argument
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  
  const sectorArg = args.find(arg => arg.startsWith('--sector='));
  const sector = sectorArg ? sectorArg.split('=')[1] : null;
  
  if (limit) {
    console.log(`📊 Processing first ${limit} stocks only\n`);
  }
  
  if (sector) {
    console.log(`📊 Filtering by sector: ${sector}\n`);
  }
  
  // Start population
  const startTime = Date.now();
  
  try {
    const results = await populateAllStocks(limit, sector);
    
    // Populate corporate actions
    console.log("\n" + "=".repeat(60));
    const corporateResult = await populateCorporateActions();
    if (!corporateResult.success) {
      console.warn(`⚠️  Corporate actions population failed: ${corporateResult.error}`);
    }
    
    // Populate earnings analyst data (refresh existing data)
    console.log("\n" + "=".repeat(60));
    const earningsResult = await populateEarningsAnalystData();
    if (!earningsResult.success) {
      console.warn(`⚠️  Earnings analyst data update failed: ${earningsResult.error}`);
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log("\n" + "=".repeat(60));
    console.log("✨ POPULATION COMPLETE!");
    console.log("=".repeat(60));
    console.log(`⏱️  Total time: ${duration} minutes`);
    console.log("\n📊 Next steps:");
    console.log("   1. Verify data: Check PostgreSQL tables");
    console.log("   2. Test screener: Run queries against the database");
    console.log("   3. Schedule updates: Set up daily data sync");
    
  } catch (error) {
    console.error("\n❌ Population failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await db.pool.end();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
