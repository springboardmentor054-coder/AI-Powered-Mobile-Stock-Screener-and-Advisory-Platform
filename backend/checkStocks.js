require('dotenv').config();
const db = require('./config/database');

async function checkLoadedStocks() {
  try {
    console.log('\n📊 STOCKS CURRENTLY IN DATABASE\n');
    console.log('='.repeat(80));
    
    // Get all stocks
    const stocks = await db.pool.query(`
      SELECT symbol, company_name, sector, industry 
      FROM stocks 
      ORDER BY sector, symbol
    `);
    
    if (stocks.rows.length === 0) {
      console.log('\n⚠️  No stocks found in database. Run population script first.\n');
    } else {
      console.log(`\nTotal stocks loaded: ${stocks.rows.length}\n`);
      
      // Group by sector
      const sectors = {};
      stocks.rows.forEach(stock => {
        if (!sectors[stock.sector]) {
          sectors[stock.sector] = [];
        }
        sectors[stock.sector].push(stock);
      });
      
      // Display by sector
      Object.keys(sectors).sort().forEach(sector => {
        console.log(`\n📈 ${sector} (${sectors[sector].length} stocks)`);
        console.log('-'.repeat(80));
        sectors[sector].forEach(stock => {
          console.log(`   ${stock.symbol.padEnd(8)} - ${stock.company_name}`);
        });
      });
      
      // Check fundamentals
      console.log('\n\n📊 FUNDAMENTALS DATA\n');
      console.log('='.repeat(80));
      const fundamentals = await db.pool.query(`
        SELECT symbol, pe_ratio, peg_ratio, total_debt, free_cash_flow 
        FROM fundamentals 
        ORDER BY symbol
        LIMIT 10
      `);
      
      if (fundamentals.rows.length > 0) {
        console.log('\nSample fundamentals (first 10):');
        console.table(fundamentals.rows);
      } else {
        console.log('\n⚠️  No fundamentals data found.\n');
      }
      
      // Check financials
      const financials = await db.pool.query(`
        SELECT COUNT(*) as count FROM financials
      `);
      console.log(`\n📊 Financial records: ${financials.rows[0].count}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Database check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await db.pool.end();
  }
}

checkLoadedStocks();
