require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function checkPERatioChanges() {
  try {
    const query = `
      SELECT 
        symbol, 
        snapshot_date,
        current_price,
        eps,
        pe_ratio,
        price_change,
        price_change_percentage
      FROM wishlist_history 
      WHERE user_id = 1 
      ORDER BY symbol, snapshot_date DESC
    `;
    
    const result = await pool.query(query);
    
    console.log('\n📊 Wishlist History - P/E Ratio Changes:\n');
    console.table(result.rows);
    
    // Show comparison for each stock
    const stocks = {};
    result.rows.forEach(row => {
      if (!stocks[row.symbol]) stocks[row.symbol] = [];
      stocks[row.symbol].push(row);
    });
    
    console.log('\n📈 Daily Comparison:\n');
    Object.keys(stocks).forEach(symbol => {
      const snapshots = stocks[symbol];
      if (snapshots.length >= 2) {
        const today = snapshots[0];
        const yesterday = snapshots[1];
        
        const peChange = today.pe_ratio - yesterday.pe_ratio;
        const peChangePct = ((peChange / yesterday.pe_ratio) * 100).toFixed(2);
        
        console.log(`\n${symbol}:`);
        console.log(`  Yesterday: Price $${yesterday.current_price?.toFixed(2)}, P/E ${yesterday.pe_ratio?.toFixed(2)}`);
        console.log(`  Today:     Price $${today.current_price?.toFixed(2)}, P/E ${today.pe_ratio?.toFixed(2)}`);
        console.log(`  P/E Change: ${peChange >= 0 ? '+' : ''}${peChange.toFixed(2)} (${peChangePct}%)`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPERatioChanges();
