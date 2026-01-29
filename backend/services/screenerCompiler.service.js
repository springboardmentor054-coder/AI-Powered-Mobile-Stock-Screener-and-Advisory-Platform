/**
 * Converts structured DSL to SAFE SQL
 */

const ALLOWED_FIELDS = {
  pe_ratio: "f.pe_ratio",
  pb_ratio: "f.pb_ratio",
  debt_to_equity: "f.debt_to_equity",
  eps: "f.eps",
  market_cap: "f.market_cap",
  revenue_yoy_growth: "f.revenue_yoy_growth",
  eps_yoy_growth: "f.eps_yoy_growth"
};

function compileDSL(dsl) {
  let sql = `
    SELECT 
      c.ticker_symbol,
      c.company_name,
      c.sector,
      f.pe_ratio,
      f.pb_ratio,
      f.debt_to_equity,
      f.eps,
      f.market_cap,
      f.eps_yoy_growth,
      f.revenue_yoy_growth
    FROM company c
    JOIN fundamentals f ON c.company_id = f.company_id
    WHERE 1=1
  `;

  // ✅ Sector filter
  if (dsl.sector) {
    sql += ` AND c.sector = '${dsl.sector.replace("'", "''")}'`;
  }

  // ✅ Numeric filters (SAFE)
  if (dsl.filters && Array.isArray(dsl.filters)) {
    dsl.filters.forEach(filter => {
      const column = ALLOWED_FIELDS[filter.field];
      if (!column) return; // Ignore anything not whitelisted

      const value = Number(filter.value);
      if (isNaN(value)) return;

      const allowedOps = ["<", ">", "<=", ">=", "=", "!="];
      if (!allowedOps.includes(filter.operator)) return;

      sql += ` AND ${column} ${filter.operator} ${value}`;
    });
  }

  sql += " LIMIT 100";

  return sql;
}

module.exports = compileDSL;