// backend/services/dataIngestion.service.js
const yf = require("yahoo-finance2").default;
const pool = require("../config/db");

async function fetchAndStoreFundamentals(tickerSymbol) {
  try {
    const data = await yf.quoteSummary(tickerSymbol, {
      modules: ["defaultKeyStatistics", "financialData", "price"]
    });

    const stats = data.defaultKeyStatistics || {};
    const fin = data.financialData || {};
    const price = data.price || {};

    const values = {
      pe_ratio: stats.trailingPE || null,
      pb_ratio: stats.priceToBook || null,
      peg_ratio: stats.pegRatio || null,
      roe: fin.returnOnEquity || null,
      debt_to_equity: fin.debtToEquity || null,
      revenue_yoy_growth: fin.revenueGrowth || null,
      eps_yoy_growth: stats.earningsQuarterlyGrowth || null,
      net_profit_margin: fin.profitMargins || null,
      operating_margin: fin.operatingMargins || null,
      gross_margin: fin.grossMargins || null,
      ebitda_margin: fin.ebitdaMargins || null,
      market_cap: price.marketCap || null,
      eps: stats.trailingEps || null
    };

    const companyRes = await pool.query(
      "SELECT company_id FROM company WHERE ticker_symbol=$1",
      [tickerSymbol]
    );

    if (!companyRes.rows.length) return;

    const companyId = companyRes.rows[0].company_id;

    await pool.query(
      `INSERT INTO fundamentals (
        company_id, pe_ratio, pb_ratio, peg_ratio, roe,
        revenue_yoy_growth, eps_yoy_growth,
        net_profit_margin, operating_margin, gross_margin, ebitda_margin,
        debt_to_equity, market_cap, eps
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (company_id)
      DO UPDATE SET
        pe_ratio=EXCLUDED.pe_ratio,
        pb_ratio=EXCLUDED.pb_ratio,
        peg_ratio=EXCLUDED.peg_ratio,
        roe=EXCLUDED.roe,
        revenue_yoy_growth=EXCLUDED.revenue_yoy_growth,
        eps_yoy_growth=EXCLUDED.eps_yoy_growth,
        net_profit_margin=EXCLUDED.net_profit_margin,
        operating_margin=EXCLUDED.operating_margin,
        gross_margin=EXCLUDED.gross_margin,
        ebitda_margin=EXCLUDED.ebitda_margin,
        debt_to_equity=EXCLUDED.debt_to_equity,
        market_cap=EXCLUDED.market_cap,
        eps=EXCLUDED.eps,
        updated_at=NOW()`,
      [companyId, ...Object.values(values)]
    );

    console.log(`Updated ${tickerSymbol}`);
  } catch (err) {
    console.error(err.message);
  }
}

module.exports = { fetchAndStoreFundamentals };