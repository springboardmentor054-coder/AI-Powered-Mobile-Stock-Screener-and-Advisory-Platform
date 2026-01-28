const db = require('../config/db');

// List of dummy companies (you can add more)
const dummyCompanies = [
  'TCS',
  'INFY',
  'RELIANCE',
  'HCLTECH',
  'WIPRO',
  'TECHM',
  'LTI',
  'MPHASIS',
  'COFORGE',
  'MINDTREE',
  'LTTS',
  'ORACLEFIN',
  'SONATA',
  'CYIENT',
  'TATAELXSI',
  'KPIT',
  'HEXWARE',
  'PERSISTENT',
  'NIITTECH',
  'INFIBEAM'
];

async function fetchDummyStocks() {
  for (const symbol of dummyCompanies) {
    try {
      // Insert company
      const compRes = await db.query(
        `INSERT INTO companies (ticker_symbol, company_name, exchange, data_source)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [symbol, `${symbol} Ltd.`, 'NSE', 'DummyData']
      );

      const companyId = compRes.rows[0].id;

      // Insert dummy metrics
      await db.query(
        `INSERT INTO valuation_metrics 
         (company_id, pe_ratio, peg_ratio, pb_ratio, dividend_payout_ratio)
         VALUES ($1, $2, $3, $4, $5)`,
        [companyId, Math.random() * 50, Math.random() * 3, Math.random() * 10, Math.random() * 10]
      );

      await db.query(
        `INSERT INTO price_market_data 
         (company_id, current_price, open_price, high_price, low_price, close_price, volume, price_change_pct)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [companyId, 100 + Math.random() * 500, 100, 110, 90, 105, Math.floor(Math.random() * 1000000), Math.random() * 5]
      );

      await db.query(`INSERT INTO growth_profitability_metrics (company_id) VALUES ($1)`, [companyId]);
      await db.query(`INSERT INTO debt_metrics (company_id) VALUES ($1)`, [companyId]);
      await db.query(`INSERT INTO ownership_metrics (company_id) VALUES ($1)`, [companyId]);
      await db.query(`INSERT INTO corporate_actions (company_id) VALUES ($1)`, [companyId]);

      console.log(`✅ Dummy stock ${symbol} added successfully!`);
    } catch (err) {
      console.error(`❌ Error inserting ${symbol}:`, err.message);
    }
  }
}

module.exports = fetchDummyStocks;
