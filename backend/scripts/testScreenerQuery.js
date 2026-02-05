const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { parseQueryToDSL } = require('../services/llmParser');
const { compileDSLToSQL } = require('../services/screenerCompiler');
const db = require('../config/database');

async function testQuery() {
  try {
    const query = "show the financial services stock named Aflac Incorporated with symbol AFL";
    
    console.log('🔍 Testing query:', query);
    console.log('\n1️⃣ Parsing to DSL...');
    
    const parseResult = await parseQueryToDSL(query);
    
    if (parseResult.error) {
      console.error('❌ Parse failed:', parseResult.message);
      console.error('Details:', parseResult.details);
      process.exit(1);
    }
    
    console.log('✅ DSL generated:');
    console.log(JSON.stringify(parseResult.dsl, null, 2));
    
    console.log('\n2️⃣ Compiling to SQL...');
    const sqlResult = compileDSLToSQL(parseResult.dsl);
    
    if (sqlResult.error) {
      console.error('❌ SQL compilation failed:', sqlResult.message);
      process.exit(1);
    }
    
    console.log('✅ SQL generated:');
    console.log(sqlResult.sql);
    
    console.log('\n3️⃣ Executing query...');
    const result = await db.query(sqlResult.sql);
    
    console.log(`✅ Found ${result.rows.length} results:`);
    if (result.rows.length > 0) {
      console.table(result.rows.slice(0, 5));
    } else {
      console.log('No stocks matched the criteria');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testQuery();
