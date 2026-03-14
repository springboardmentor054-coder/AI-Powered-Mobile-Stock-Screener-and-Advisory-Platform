require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');
const { generateAlertsForWishlistChanges } = require('../services/alertService');

/**
 * This script captures daily snapshots of all wishlisted stocks
 * Run this AFTER updateAllStocks.js to capture the updated data
 */
async function captureWishlistSnapshots() {
  try {
    console.log('📸 Starting wishlist snapshot capture...\n');

    // Get all unique symbols that are wishlisted by any user
    const wishlistedStocksQuery = `
      SELECT DISTINCT w.symbol, w.user_id
      FROM wishlist w
      ORDER BY w.symbol
    `;
    
    const wishlistedStocks = await pool.query(wishlistedStocksQuery);
    
    if (wishlistedStocks.rows.length === 0) {
      console.log('No wishlisted stocks found. Exiting.');
      process.exit(0);
    }

    console.log(`Found ${wishlistedStocks.rows.length} wishlist entries to snapshot\n`);

    let successCount = 0;
    let errorCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const item of wishlistedStocks.rows) {
      const { symbol, user_id } = item;

      try {
        // Get current stock data with latest price
        const stockDataQuery = `
          SELECT 
            s.symbol,
            s.market_cap,
            f.pe_ratio as static_pe_ratio,
            f.pb_ratio,
            f.eps,
            f.dividend_yield,
            COALESCE(ead.current_price, ph.close, ph.adjusted_close) as current_price,
            ph.open,
            ph.high,
            ph.low,
            ph.volume,
            ph.close as close_price,
            -- Calculate dynamic P/E ratio based on current price and round to 2 decimal places
            ROUND(
              CAST(
                CASE 
                  WHEN f.eps IS NOT NULL AND f.eps > 0 AND COALESCE(ead.current_price, ph.close, ph.adjusted_close) IS NOT NULL
                  THEN COALESCE(ead.current_price, ph.close, ph.adjusted_close) / f.eps
                  ELSE f.pe_ratio
                END AS NUMERIC
              ), 2
            ) as pe_ratio
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
        `;

        const stockData = await pool.query(stockDataQuery, [symbol]);

        if (stockData.rows.length === 0) {
          console.log(`⚠️  No data found for ${symbol}`);
          errorCount++;
          continue;
        }

        const data = stockData.rows[0];

        // Get yesterday's snapshot for comparison
        const yesterdayQuery = `
          SELECT current_price, volume
          FROM wishlist_history
          WHERE user_id = $1 AND symbol = $2
          ORDER BY snapshot_date DESC
          LIMIT 1
        `;

        const yesterday = await pool.query(yesterdayQuery, [user_id, symbol]);
        
        let priceChange = null;
        let priceChangePercentage = null;
        let volumeChangePercentage = null;

        if (yesterday.rows.length > 0 && data.current_price) {
          const prevPrice = yesterday.rows[0].current_price;
          priceChange = data.current_price - prevPrice;
          priceChangePercentage = ((priceChange / prevPrice) * 100).toFixed(2);

          if (yesterday.rows[0].volume && data.volume) {
            const prevVolume = yesterday.rows[0].volume;
            volumeChangePercentage = (((data.volume - prevVolume) / prevVolume) * 100).toFixed(2);
          }
        }

        // Insert snapshot
        const insertQuery = `
          INSERT INTO wishlist_history (
            user_id, symbol, snapshot_date,
            current_price, open_price, high_price, low_price, volume,
            pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
            price_change, price_change_percentage, volume_change_percentage
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (user_id, symbol, snapshot_date)
          DO UPDATE SET
            current_price = EXCLUDED.current_price,
            open_price = EXCLUDED.open_price,
            high_price = EXCLUDED.high_price,
            low_price = EXCLUDED.low_price,
            volume = EXCLUDED.volume,
            pe_ratio = EXCLUDED.pe_ratio,
            pb_ratio = EXCLUDED.pb_ratio,
            eps = EXCLUDED.eps,
            dividend_yield = EXCLUDED.dividend_yield,
            market_cap = EXCLUDED.market_cap,
            price_change = EXCLUDED.price_change,
            price_change_percentage = EXCLUDED.price_change_percentage,
            volume_change_percentage = EXCLUDED.volume_change_percentage
        `;

        await pool.query(insertQuery, [
          user_id,
          symbol,
          today,
          data.current_price,
          data.open,
          data.high,
          data.low,
          data.volume,
          data.pe_ratio,
          data.pb_ratio,
          data.eps,
          data.dividend_yield,
          data.market_cap,
          priceChange,
          priceChangePercentage,
          volumeChangePercentage
        ]);

        successCount++;
        console.log(`✅ Captured snapshot for ${symbol} (User: ${user_id})`);

      } catch (error) {
        console.error(`❌ Error capturing snapshot for ${symbol}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Snapshot capture complete:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    // Generate alerts for changes detected in snapshots
    console.log('\n🔔 Generating alerts for detected changes...');
    try {
      const alertResult = await generateAlertsForWishlistChanges();
      console.log(`✅ Generated ${alertResult.alertsGenerated} alerts`);
    } catch (alertError) {
      console.error('❌ Error generating alerts:', alertError.message);
    }
    
    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

captureWishlistSnapshots();
