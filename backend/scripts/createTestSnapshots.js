require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function createTestSnapshots() {
  try {
    console.log('🧪 Creating test snapshots with varying data...\n');

    // Delete existing snapshots
    await pool.query('DELETE FROM wishlist_history WHERE user_id = 1');
    console.log('✅ Cleared existing snapshots');

    // Create Feb 3 snapshots (yesterday)
    await pool.query(`
      INSERT INTO wishlist_history (
        user_id, symbol, snapshot_date,
        current_price, open_price, high_price, low_price, volume,
        pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
        price_change, price_change_percentage, volume_change_percentage
      ) VALUES 
        (1, 'AAPL', '2026-02-04', 269.48, 265.00, 271.00, 264.50, 85000000, 36.17, 45.5, 7.45, 0.52, 4150000000000, 10.00, 3.85, 15.50),
        (1, 'MSFT', '2026-02-04', 411.21, 408.00, 415.00, 407.50, 72000000, 29.21, 12.3, 14.08, 0.75, 3050000000000, -19.08, -4.43, -20.00)
    `);
    console.log('✅ Created Feb 4 (yesterday) snapshots');

    // Create Feb 5 snapshots (today) with different prices
    await pool.query(`
      INSERT INTO wishlist_history (
        user_id, symbol, snapshot_date,
        current_price, open_price, high_price, low_price, volume,
        pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
        price_change, price_change_percentage, volume_change_percentage
      ) VALUES 
        (1, 'AAPL', '2026-02-05', 275.20, 270.00, 276.50, 269.00, 95000000, 36.94, 46.2, 7.45, 0.52, 4220000000000, 5.72, 2.12, 11.76),
        (1, 'MSFT', '2026-02-05', 418.50, 412.00, 420.00, 410.00, 68000000, 29.72, 12.5, 14.08, 0.75, 3110000000000, 7.29, 1.77, -5.56)
    `);
    console.log('✅ Created Feb 5 (today) snapshots');

    // Update earnings_analyst_data to match
    await pool.query(`
      UPDATE earnings_analyst_data 
      SET current_price = 275.20 
      WHERE symbol = 'AAPL'
    `);
    await pool.query(`
      UPDATE earnings_analyst_data 
      SET current_price = 418.50 
      WHERE symbol = 'MSFT'
    `);
    console.log('✅ Updated current prices in earnings_analyst_data');

    // Show results
    const result = await pool.query(`
      SELECT symbol, snapshot_date, current_price, price_change, price_change_percentage, volume
      FROM wishlist_history
      ORDER BY symbol, snapshot_date DESC
    `);
    
    console.log('\n📊 Test Data Created:\n');
    console.table(result.rows);

    console.log('\n✨ Now refresh your Flutter app to see the changes!');
    console.log('Expected results:');
    console.log('  AAPL: $275.20 (↑ +$5.72 / +2.12%)');
    console.log('  MSFT: $418.50 (↑ +$7.29 / +1.77%)');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestSnapshots();
