/**
 * Compiles DSL (Domain Specific Language) JSON to SQL query
 * Queries Dhan CSV data from dhan_stocks table
 * 
 * Expected DSL format:
 * {
 *   "filters": [
 *     { "field": "pe_ratio", "operator": "<", "value": 25 },
 *     { "field": "market_cap_cr", "operator": ">", "value": 1000 }
 *   ]
 * }
 */

const ALLOWED_FIELDS = [
  "pe_ratio",
  "market_cap_cr",
  "industry_pe",
  "pb_ratio",
  "roe",
  "roce",
  "eps",
  "ltp",
  "change_pct",
  "open",
  "volume",
  "return_1m",
  "return_3m",
  "return_1y",
  "return_3y",
  "return_5y",
  "rsi",
  "dividend",
  "high_52w",
  "low_52w",
  "dma_50",
  "dma_200",
  "margin_funding",
  "margin_pledge"
];
const ALLOWED_OPERATORS = ["<", ">", "<=", ">=", "="];

function compileDSL(dsl) {
  console.log("Compiling DSL:", JSON.stringify(dsl, null, 2));

  // Basic validation
  if (dsl.filters) {
    dsl.filters.forEach((filter) => {
      if (!ALLOWED_FIELDS.includes(filter.field)) {
        throw new Error(`Unknown field: ${filter.field}`);
      }
      if (!ALLOWED_OPERATORS.includes(filter.operator)) {
        throw new Error(`Invalid operator: ${filter.operator}`);
      }
    });
  }

  // Start building SQL query
  let sql = `
    SELECT 
      name,
      ltp,
      change_pct,
      open,
      volume,
      market_cap_cr,
      pe_ratio,
      industry_pe,
      pb_ratio,
      roe,
      roce,
      eps,
      return_1m,
      return_3m,
      return_1y,
      return_3y,
      return_5y,
      dividend,
      rsi,
      high_52w,
      low_52w,
      dma_50,
      dma_200,
      margin_funding,
      margin_pledge
    FROM dhan_stocks
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Add numeric filters
  if (dsl.filters && dsl.filters.length > 0) {
    dsl.filters.forEach((filter) => {
      sql += ` AND ${filter.field} ${filter.operator} $${paramIndex}`;
      params.push(filter.value);
      paramIndex++;
    });
  }

  let orderClause = "market_cap_cr DESC NULLS LAST";

  if (dsl.filters && dsl.filters.length > 0) {
    const primary = dsl.filters[0];
    if (ALLOWED_FIELDS.includes(primary.field) && typeof primary.value === "number") {
      // Rank closest to the requested threshold first so similar queries
      // (e.g. PE<10 vs PE<25) return visibly different top results.
      sql += ` ORDER BY ABS(${primary.field} - $${paramIndex}) ASC NULLS LAST, market_cap_cr DESC NULLS LAST LIMIT 100`;
      params.push(primary.value);
      paramIndex++;
      console.log("Generated SQL:", sql);
      console.log("SQL Params:", params);
      return { sql, params };
    }
  }

  sql += ` ORDER BY ${orderClause} LIMIT 100`;

  console.log("Generated SQL:", sql);
  console.log("SQL Params:", params);

  return { sql, params };
}

module.exports = { compileDSL };
