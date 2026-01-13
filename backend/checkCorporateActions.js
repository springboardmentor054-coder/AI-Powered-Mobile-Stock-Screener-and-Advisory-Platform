require("dotenv").config();
const db = require("./config/database");

async function checkCorporateActions() {
  const result = await db.query(`
    SELECT symbol, action_type, announcement_date, details, amount 
    FROM corporate_actions 
    ORDER BY symbol
  `);
  
  console.log("\n📋 Corporate Actions in Database:\n");
  
  if (result.rows.length === 0) {
    console.log("❌ No corporate actions found!");
  } else {
    result.rows.forEach(row => {
      const amountStr = row.amount ? `$${(row.amount / 1e9).toFixed(1)}B` : 'N/A';
      const dateStr = row.announcement_date.toISOString().split('T')[0];
      console.log(`✅ ${row.symbol}: ${row.action_type}`);
      console.log(`   ${row.details}`);
      console.log(`   Amount: ${amountStr} | Date: ${dateStr}\n`);
    });
  }
  
  console.log(`Total: ${result.rows.length} corporate actions`);
  process.exit(0);
}

checkCorporateActions();
