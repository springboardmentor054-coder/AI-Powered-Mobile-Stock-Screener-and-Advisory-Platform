const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');

async function checkStock() {
  try {
    console.log('Searching for AFL/Aflac stock...\n');
    
    const result = await db.query(`
      SELECT symbol, company_name, sector, industry 
      FROM stocks 
      WHERE symbol = 'AFL' OR company_name ILIKE '%aflac%'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Stock found:');
      console.table(result.rows);
    } else {
      console.log('❌ Stock NOT found in database');
      console.log('\nChecking all financial sector stocks...');
      
      const financial = await db.query(`
        SELECT symbol, company_name, sector 
        FROM stocks 
        WHERE sector ILIKE '%financial%'
        ORDER BY symbol
        LIMIT 10
      `);
      
      console.log('\nSample Financial stocks:');
      console.table(financial.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStock();
