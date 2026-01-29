/**
 * Stock Fundamentals Model Reference
 * (Used for structure clarity)
 */

const stockFundamentalsModel = {
  tableName: "fundamentals",

  columns: {
    fundamental_id: "SERIAL PRIMARY KEY",
    company_id: "INT UNIQUE REFERENCES company(company_id)",

    pe_ratio: "FLOAT",
    pb_ratio: "FLOAT",
    peg_ratio: "FLOAT",
    roe: "FLOAT",
    roic: "FLOAT",

    revenue_yoy_growth: "FLOAT",
    eps_yoy_growth: "FLOAT",
    revenue_5y_cagr: "FLOAT",
    eps_5y_cagr: "FLOAT",

    net_profit_margin: "FLOAT",
    operating_margin: "FLOAT",
    gross_margin: "FLOAT",
    ebitda_margin: "FLOAT",

    debt_to_equity: "FLOAT",
    interest_coverage: "FLOAT",

    eps: "FLOAT",
    market_cap: "BIGINT",

    fundamental_score: "INT",

    created_at: "TIMESTAMP",
    updated_at: "TIMESTAMP"
  }
};

module.exports = stockFundamentalsModel;