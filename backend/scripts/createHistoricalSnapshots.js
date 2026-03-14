require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function createHistoricalSnapshots() {
  try {
    console.log('📸 Creating historical snapshots from real price data...\n');

    // Get price data for Jan 28 and Jan 29 (most recent available)
    const priceData = await pool.query(`
      SELECT symbol, date, close, open, high, low, volume
      FROM price_history
      WHERE symbol IN ('AAPL', 'MSFT')
        AND date IN (
          SELECT DISTINCT date 
          FROM price_history 
          WHERE symbol IN ('AAPL', 'MSFT')
          ORDER BY date DESC 
          LIMIT 2
        )
      ORDER BY symbol, date
    `);

    console.log('📊 Real price data found:\n');
    console.table(priceData.rows);

    // Get fundamentals for P/E calculation
    const fundamentals = await pool.query(`
      SELECT symbol, eps, pb_ratio, dividend_yield
      FROM fundamentals
      WHERE symbol IN ('AAPL', 'MSFT')
    `);

    const fundsMap = {};
    fundamentals.rows.forEach(row => {
      fundsMap[row.symbol] = row;
    });

    // Group by symbol and date
    const dataBySymbol = {};
    priceData.rows.forEach(row => {
      if (!dataBySymbol[row.symbol]) dataBySymbol[row.symbol] = [];
      dataBySymbol[row.symbol].push(row);
    });

    // Clear existing snapshots
    await pool.query('DELETE FROM wishlist_history WHERE user_id = 1');
    console.log('\n✅ Cleared old snapshots\n');

    // Create snapshots for both dates
    let snapshotDate = new Date('2026-02-03'); // Map Jan 28 to Feb 3 (yesterday)
    
    for (const symbol of Object.keys(dataBySymbol)) {
      const prices = dataBySymbol[symbol];
      const funds = fundsMap[symbol];
      
      for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        const date = i === 0 ? '2026-02-03' : '2026-02-04'; // Yesterday and today
        
        // Calculate P/E ratio
        const peRatio = funds.eps && funds.eps > 0 ? price.close / funds.eps : null;
        
        // Calculate price change if we have previous data
        let priceChange = null;
        let priceChangePct = null;
        let volumeChangePct = null;
        
        if (i > 0) {
          const prevPrice = prices[i-1].close;
          priceChange = price.close - prevPrice;
          priceChangePct = ((priceChange / prevPrice) * 100).toFixed(2);
          
          if (prices[i-1].volume && price.volume) {
            volumeChangePct = (((price.volume - prices[i-1].volume) / prices[i-1].volume) * 100).toFixed(2);
          }
        }

        await pool.query(`
          INSERT INTO wishlist_history (
            user_id, symbol, snapshot_date,
            current_price, open_price, high_price, low_price, volume,
            pe_ratio, pb_ratio, eps, dividend_yield, market_cap,
            price_change, price_change_percentage, volume_change_percentage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          1, symbol, date,
          price.close, price.open, price.high, price.low, price.volume,
          peRatio, funds.pb_ratio, funds.eps, funds.dividend_yield, null,
          priceChange, priceChangePct, volumeChangePct
        ]);

        console.log(`✅ Created snapshot for ${symbol} on ${date}: $${price.close.toFixed(2)}`);
      }
    }

    // Show final results
    const result = await pool.query(`
      SELECT symbol, snapshot_date, current_price, price_change, price_change_percentage, volume
      FROM wishlist_history
      ORDER BY symbol, snapshot_date
    `);
    
    console.log('\n📊 Created snapshots:\n');
    console.table(result.rows);

    console.log('\n✨ Refresh your Flutter app to see real historical comparison!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createHistoricalSnapshots();
