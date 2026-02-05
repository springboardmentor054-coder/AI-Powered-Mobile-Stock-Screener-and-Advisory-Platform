const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

/**
 * Execute the quarterly financials table creation SQL script
 */
async function recreateQuarterlyFinancialsTable() {
  try {
    console.log('🔄 Recreating quarterly_financials table with correct structure...\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'createQuarterlyFinancialsTable.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Table recreated successfully!\n');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quarterly_financials'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table Structure:');
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  recreateQuarterlyFinancialsTable();
}

module.exports = { recreateQuarterlyFinancialsTable };
