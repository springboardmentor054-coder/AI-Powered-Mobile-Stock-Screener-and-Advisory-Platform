require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function restoreRealData() {
  try {
    console.log('🔄 Restoring real data...\n');

    // Delete test snapshots
    await pool.query('DELETE FROM wishlist_history WHERE user_id = 1');
    console.log('✅ Cleared test snapshots');

    // Check what real price data exists
    console.log('\n📊 Checking real price history data:\n');
    const priceData = await pool.query(`
      SELECT symbol, date, close, volume 
      FROM price_history 
      WHERE symbol IN ('AAPL', 'MSFT')
      ORDER BY symbol, date DESC 
      LIMIT 10
    `);
    console.table(priceData.rows);

    // Check current prices in earnings_analyst_data
    console.log('\n💰 Current prices in database:\n');
    const currentPrices = await pool.query(`
      SELECT symbol, current_price, updated_at
      FROM earnings_analyst_data
      WHERE symbol IN ('AAPL', 'MSFT')
    `);
    console.table(currentPrices.rows);

    // Now capture real snapshots based on actual data
    console.log('\n📸 Capturing snapshot with real data...');
    const { spawn } = require('child_process');
    const captureProcess = spawn('node', ['scripts/captureWishlistSnapshots.js'], {
      cwd: require('path').join(__dirname, '..'),
      stdio: 'inherit'
    });

    captureProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Real data restored successfully');
      }
      process.exit(code);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

restoreRealData();
