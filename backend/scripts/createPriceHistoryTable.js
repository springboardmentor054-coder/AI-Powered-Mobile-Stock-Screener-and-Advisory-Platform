const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');

/**
 * Create the price_history table
 * Run this script to add historical price tracking to your database
 */

async function createPriceHistoryTable() {
  try {
    console.log('📊 Creating price_history table...\n');

    // Create the table
    await db.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
        date DATE NOT NULL,
        open FLOAT,
        high FLOAT,
        low FLOAT,
        close FLOAT,
        volume BIGINT,
        adjusted_close FLOAT,
        PRIMARY KEY (symbol, date)
      );
    `);

    console.log('✅ Table created successfully!');

    // Create indexes for better query performance
    console.log('\n📑 Creating indexes...');
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date 
      ON price_history(symbol, date DESC);
    `);
    console.log('✅ Index on (symbol, date) created');

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_date 
      ON price_history(date DESC);
    `);
    console.log('✅ Index on date created');

    // Verify the table
    console.log('\n🔍 Verifying table structure...');
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'price_history'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table Structure:');
    console.table(result.rows);

    console.log('\n✅ price_history table is ready!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run: node scripts/loadHistoricalPrices.js');
    console.log('      This will load the last 90 days of price data for all stocks');
    console.log('\n   2. Update a specific stock:');
    console.log('      node scripts/loadHistoricalPrices.js RELIANCE 30');
    console.log('      (loads last 30 days for RELIANCE)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createPriceHistoryTable();
