require('dotenv').config();
const pool = require('../config/database');
const { parseQueryToDSL } = require('../services/llmParser');
const { compileDSLToSQL } = require('../services/screenerCompiler');

async function testQuery() {
  try {
    const query = "Companies with 4 consecutive profitable quarters in the last 12 months";
    
    console.log('Testing query:', query);
    console.log('\n1. Parsing with LLM...');
    
    const parseResult = await parseQueryToDSL(query);
    
    if (parseResult.error) {
      console.error('❌ Parsing failed:', parseResult.message);
      console.error('Details:', parseResult.details || parseResult.validationErrors);
      process.exit(1);
    }
    
    console.log('✓ Parsing successful');
    console.log('DSL:', JSON.stringify(parseResult.dsl, null, 2));
    
    console.log('\n2. Compiling to SQL...');
    const sqlResult = compileDSLToSQL(parseResult.dsl);
    
    if (sqlResult.error) {
      console.error('❌ SQL compilation failed:', sqlResult.message);
      console.error('Details:', sqlResult.details);
      process.exit(1);
    }
    
    console.log('✓ SQL compilation successful');
    console.log('\nGenerated SQL:');
    console.log(sqlResult.sql);
    
    console.log('\n3. Executing query...');
    const result = await pool.query(sqlResult.sql);
    
    console.log(`✓ Query successful! Found ${result.rows.length} companies`);
    
    if (result.rows.length > 0) {
      console.log('\nFirst few results:');
      result.rows.slice(0, 5).forEach(row => {
        console.log(`  - ${row.company_name} (${row.symbol}): ${row.quarter_count} quarters`);
      });
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testQuery();
