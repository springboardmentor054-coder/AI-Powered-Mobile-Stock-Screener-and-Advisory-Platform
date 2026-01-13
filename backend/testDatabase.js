require("dotenv").config();
const db = require("./config/database");

async function testDatabase() {
  console.log("\n🔍 Testing Database Connection...\n");
  console.log("Configuration:");
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}\n`);
  
  try {
    const isConnected = await db.testConnection();
    
    if (isConnected) {
      console.log("✅ Database connection successful!\n");
      
      // Check if tables exist
      console.log("Checking tables...");
      const result = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      if (result.rows.length > 0) {
        console.log(`\n✅ Found ${result.rows.length} tables:`);
        result.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
        console.log("\n🎉 Database is ready to use!");
      } else {
        console.log("\n⚠️  No tables found. You need to run schema.sql");
        console.log("   Use pgAdmin Query Tool to execute schema.sql");
      }
    } else {
      console.log("❌ Database connection failed!");
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("  1. Make sure PostgreSQL service is running");
    console.error("  2. Check your password in .env file");
    console.error("  3. Verify database 'stock_screener' exists");
  } finally {
    await db.pool.end();
  }
}

testDatabase();
