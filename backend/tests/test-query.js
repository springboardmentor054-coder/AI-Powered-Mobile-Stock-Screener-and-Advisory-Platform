require("dotenv").config();
const { parseQuery } = require("../llm");
const { compileDSL } = require("../compileDSL");

async function test() {
  console.log("\n=== Testing Query Parsing ===\n");
  
  const queries = [
    "Show IT stocks",
    "IT stocks with PE below 5",
    "IT stocks with PE less than 30",
    "Finance stocks with PEG ratio less than 2"
  ];
  
  for (const query of queries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log("-".repeat(50));
    
    try {
      const dsl = await parseQuery(query);
      console.log("✅ DSL:", JSON.stringify(dsl, null, 2));
      
      const { sql, params } = compileDSL(dsl);
      console.log("✅ SQL Generated");
      console.log("Params:", params);
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }
}

test().catch(console.error);
