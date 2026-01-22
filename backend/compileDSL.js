/**
 * Compiles DSL (Domain Specific Language) JSON to SQL query
 * 
 * Expected DSL format:
 * {
 *   "sector": "IT",
 *   "filters": [
 *     { "field": "pe_ratio", "operator": "<", "value": 5 }
 *   ],
 *   "last_quarters": 4
 * }
 */

const ALLOWED_FIELDS = ["pe_ratio", "peg_ratio", "debt_to_fcf", "revenue_growth"];
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
      c.symbol,
      c.name,
      c.sector,
      f.pe_ratio,
      f.peg_ratio,
      f.debt_to_fcf,
      f.market_cap,
      f.revenue_growth
    FROM companies c
    INNER JOIN fundamentals f ON c.symbol = f.symbol
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Add sector filter
  if (dsl.sector) {
    sql += ` AND c.sector = $${paramIndex}`;
    params.push(dsl.sector);
    paramIndex++;
  }

  // Add numeric filters
  if (dsl.filters && dsl.filters.length > 0) {
    dsl.filters.forEach((filter) => {
      sql += ` AND f.${filter.field} ${filter.operator} $${paramIndex}`;
      params.push(filter.value);
      paramIndex++;
    });
  }

  // Add last_quarters filter (optional)
  if (dsl.last_quarters) {
    sql += ` AND c.symbol IN (
      SELECT company_id
      FROM quarterly_financials
      WHERE quarter >= CURRENT_DATE - INTERVAL '${dsl.last_quarters * 3} months'
      GROUP BY company_id
      HAVING COUNT(*) = ${dsl.last_quarters} AND MIN(revenue) > 0
    )`;
  }

  // Add ordering
  sql += ` ORDER BY f.market_cap DESC LIMIT 100`;

  console.log("Generated SQL:", sql);
  console.log("SQL Params:", params);

  return { sql, params };
}

module.exports = { compileDSL };
