const pool = require("../database");
const { fetchCompanyOverview } = require("../services/marketData.service");

// Fetch and store stock data from Alpha Vantage API
async function fetchAndStoreStock(req, res) {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const data = await fetchCompanyOverview(ticker);

    const symbolResult = await pool.query(
      `
      INSERT INTO symbols (ticker, exchange, company_name, sector, industry)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (ticker)
      DO UPDATE SET ticker = EXCLUDED.ticker
      RETURNING id
      `,
      [ticker, "NSE", data.Name, data.Sector, data.Industry]
    );

    const symbolId = symbolResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO fundamentals
      (symbol_id, pe_ratio, market_cap, eps, debt_to_equity, promoter_holding)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol_id)
      DO UPDATE SET 
        pe_ratio = EXCLUDED.pe_ratio,
        market_cap = EXCLUDED.market_cap,
        eps = EXCLUDED.eps,
        debt_to_equity = EXCLUDED.debt_to_equity,
        promoter_holding = EXCLUDED.promoter_holding
      `,
      [
        symbolId,
        data.PERatio,
        data.MarketCapitalization,
        data.EPS,
        data.DebtToEquity,
        data.PromoterHolding || 0
      ]
    );

    res.json({ message: "Market data fetched and stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// This API reads stock data from all tables
async function getStocks(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        s.ticker,
        s.company_name,
        s.sector,
        s.industry,
        f.pe_ratio,
        f.market_cap,
        f.eps,
        f.debt_to_equity,
        f.promoter_holding
      FROM symbols s
      JOIN fundamentals f ON f.symbol_id = s.id
      ORDER BY s.ticker;
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { fetchAndStoreStock, getStocks };
