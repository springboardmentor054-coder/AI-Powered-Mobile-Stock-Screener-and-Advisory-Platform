require("dotenv").config();
const corporateActionsService = require("./services/corporateActionsService");
const db = require("./config/database");

/**
 * Update corporate actions (dividends, splits, buybacks) for all stocks
 */
async function updateCorporateActions() {
  console.log("🔄 Updating corporate actions for all stocks...\n");
  
  try {
    // Get all stocks from database
    const result = await db.query("SELECT symbol, company_name FROM stocks WHERE is_active = true ORDER BY symbol");
    const stocks = result.rows;
    
    console.log(`Found ${stocks.length} stocks to update\n`);
    
    let successful = 0;
    let failed = 0;
    let totalActions = 0;
    
    for (let i = 0; i < stocks.length; i++) {
      const { symbol, company_name } = stocks[i];
      
      console.log(`\n[${i + 1}/${stocks.length}] Checking ${symbol} (${company_name})...`);
      
      try {
        // Fetch all corporate actions
        const actions = await corporateActionsService.getAllCorporateActions(symbol);
        
        if (actions.length > 0) {
          console.log(`  Found ${actions.length} corporate action(s)`);
          
          for (const action of actions) {
            try {
              await corporateActionsService.insertCorporateAction(action);
              console.log(`  ✅ Added: ${action.actionType} - ${action.details}`);
              totalActions++;
            } catch (error) {
              console.log(`  ⚠️  Could not add action: ${error.message}`);
            }
          }
        } else {
          console.log(`  ℹ️  No corporate actions found`);
        }
        
        successful++;
        
        // Be polite with requests - 1 second delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Stocks processed: ${successful}`);
    console.log(`📋 Total actions added: ${totalActions}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total stocks: ${stocks.length}`);
    console.log("\n💡 Note: Corporate actions data is limited to dividends and splits.");
    console.log("   Stock buyback data requires SEC filings and is not available via Yahoo Finance.");
    
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
  } finally {
    process.exit(0);
  }
}

// Run the update
updateCorporateActions();
