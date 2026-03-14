require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function createCurrentSnapshots() {
  try {
    console.log('🧪 Creating snapshots for current dates (Feb 9-10)...\n');

    // Get current date (Feb 10, 2026)
    const today = '2026-02-10';
    const yesterday = '2026-02-09';

    // Delete existing snapshots for these dates
    await pool.query('DELETE FROM wishlist_history WHERE snapshot_date IN ($1, $2)', [today, yesterday]);
    console.log('✅ Cleared existing snapshots for Feb 9-10');

    // Get all wishlisted stocks for user_id = 1
    const wishlistResult = await pool.query(`
      SELECT DISTINCT w.symbol, w.user_id
      FROM wishlist w
      WHERE w.user_id = 1
    `);

    if (wishlistResult.rows.length === 0) {
      console.log('⚠️  No stocks in wishlist. Please add some stocks first.');
      process.exit(0);
    }

    console.log(`Found ${wishlistResult.rows.length} stocks in wishlist\n`);

    // Create yesterday's snapshots (Feb 9)
    for (const item of wishlistResult.rows) {
      const { symbol, user_id } = item;

      // Get current stock data
      const stockData = await pool.query(`
        SELECT 
          s.symbol,
          s.market_cap,
          f.pe_ratio,
          f.pb_ratio,
          f.eps,
          f.dividend_yield,
          COALESCE(ead.current_price, ph.close, ph.adjusted_close) as current_price,
          ph.open,
          ph.high,
          ph.low,
          ph.volume
        FROM stocks s
        LEFT JOIN fundamentals f ON s.symbol = f.symbol
        LEFT JOIN earnings_analyst_data ead ON s.symbol = ead.symbol
        LEFT JOIN LATERAL (
          SELECT open, high, low, close, adjusted_close, volume
          FROM price_history
          WHERE symbol = s.symbol
          ORDER BY date DESC
          LIMIT 1
        ) ph ON true
        WHERE s.symbol = $1
      `, [symbol]);

      if (stockData.rows.length === 0) {
        console.log(`⚠️  No data for ${symbol}, skipping...`);
        continue;
      }

      const data = stockData.rows[0];
      if (!data.current_price) {
        console.log(`⚠️  No price for ${symbol}, skipping...`);
        continue;
      }

      // Yesterday's price (slightly lower)
      const yesterdayPrice = data.current_price * 0.98; // 2% lower
      const yesterdayVolume = data.volume ? data.volume * 0.95 : 1000000;

      await pool.query(`
        INSERT INTO wishlist_history (
          user_id, symbol, snapshot_date,
          current_price, open_price, high_price, low_price, volume,
          pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
          price_change, price_change_percentage, volume_change_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        user_id,
        symbol,
        yesterday,
        yesterdayPrice,
        yesterdayPrice * 0.99,
        yesterdayPrice * 1.01,
        yesterdayPrice * 0.98,
        yesterdayVolume,
        data.pe_ratio,
        data.pb_ratio,
        data.eps,
        data.dividend_yield,
        data.market_cap,
        0, // price_change
        0, // price_change_percentage
        0  // volume_change_percentage
      ]);

      console.log(`✅ Created yesterday snapshot for ${symbol} at $${yesterdayPrice.toFixed(2)}`);

      // Today's price (current price)
      const todayPrice = data.current_price;
      const todayVolume = data.volume || 1000000;
      const priceChange = todayPrice - yesterdayPrice;
      const priceChangePct = (priceChange / yesterdayPrice) * 100;
      const volumeChangePct = ((todayVolume - yesterdayVolume) / yesterdayVolume) * 100;

      await pool.query(`
        INSERT INTO wishlist_history (
          user_id, symbol, snapshot_date,
          current_price, open_price, high_price, low_price, volume,
          pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
          price_change, price_change_percentage, volume_change_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        user_id,
        symbol,
        today,
        todayPrice,
        data.open || todayPrice * 0.99,
        data.high || todayPrice * 1.01,
        data.low || todayPrice * 0.98,
        todayVolume,
        data.pe_ratio,
        data.pb_ratio,
        data.eps,
        data.dividend_yield,
        data.market_cap,
        priceChange,
        priceChangePct,
        volumeChangePct
      ]);

      console.log(`✅ Created today snapshot for ${symbol} at $${todayPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} / ${priceChangePct.toFixed(2)}%)`);
    }

    // Show results
    const result = await pool.query(`
      SELECT symbol, snapshot_date, current_price, price_change, price_change_percentage, volume
      FROM wishlist_history
      WHERE user_id = 1 AND snapshot_date IN ($1, $2)
      ORDER BY symbol, snapshot_date
    `, [yesterday, today]);
    
    console.log('\n📊 Snapshots Created:\n');
    console.table(result.rows);

    console.log('\n✨ Now refresh your Flutter app to see the wishlist analysis data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCurrentSnapshots();
