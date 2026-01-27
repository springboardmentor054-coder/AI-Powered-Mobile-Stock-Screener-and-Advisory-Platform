// Map fields to their table aliases for proper SQL joins
const FIELD_TO_TABLE = {
  // Fundamentals table
  'pe_ratio': 'f', 'peg_ratio': 'f', 'pb_ratio': 'f', 'ps_ratio': 'f',
  'dividend_yield': 'f', 'beta': 'f', 'eps': 'f', 'book_value_per_share': 'f',
  'profit_margin': 'f', 'operating_margin': 'f', 'return_on_equity': 'f',
  'return_on_assets': 'f', 'current_ratio': 'f', 'quick_ratio': 'f',
  'interest_coverage': 'f', 'debt_to_equity_ratio': 'f', 'total_debt': 'f',
  'free_cash_flow': 'f', 'debt_to_fcf_ratio': 'f',
  // Shareholding table
  'promoter_holding_percentage': 'sh', 'institutional_holding_percentage': 'sh',
  'public_holding_percentage': 'sh', 'foreign_institutional_holding': 'sh',
  'domestic_institutional_holding': 'sh', 'mutual_fund_holding': 'sh',
  'retail_holding': 'sh', 'promoter_pledge_percentage': 'sh',
  // Stocks table
  'market_cap': 's', 'employees': 's', 'average_volume': 's',
  'shares_outstanding': 's', 'insider_ownership_percentage': 's',
  'institutional_ownership_percentage': 's'
};

// Fields that represent percentages (stored as decimals: 0.2 = 20%)
const PERCENTAGE_FIELDS = [
  'promoter_holding_percentage', 'institutional_holding_percentage',
  'public_holding_percentage', 'foreign_institutional_holding',
  'domestic_institutional_holding', 'mutual_fund_holding', 
  'retail_holding', 'promoter_pledge_percentage',
  'insider_ownership_percentage', 'institutional_ownership_percentage',
  'dividend_yield', 'profit_margin', 'operating_margin',
  'return_on_equity', 'return_on_assets', 'gross_margin',
  'operating_margin', 'net_margin'
];

// Map LLM sector names to database sector names
const SECTOR_MAPPING = {
  'Technology': 'TECHNOLOGY',
  'IT': 'TECHNOLOGY',
  'Financials': 'FINANCIAL SERVICES',
  'Financial': 'FINANCIAL SERVICES',
  'Financial Services': 'FINANCIAL SERVICES',
  'Healthcare': 'HEALTHCARE',
  'Consumer': 'CONSUMER',
  'Energy': 'ENERGY',
  'Industrials': 'INDUSTRIALS',
  'Communication Services': 'COMMUNICATION SERVICES'
};

/**
 * Escapes SQL values to prevent injection
 * @param {any} value - Value to escape
 * @returns {string} - Escaped value
 */

function escapeSQLValue(value) {
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    // Remove dangerous characters and escape single quotes
    return "'" + value.replace(/'/g, "''").replace(/[;\\]/g, '') + "'";
  }
  return "NULL";
}

/**
 * Compiles DSL to SQL query with error handling and SQL injection prevention
 * @param {Object} dsl - The validated DSL object
 * @returns {Object} - { error: boolean, sql: string, message: string }
 */
function compileDSLToSQL(dsl) {
  try {
    // Validate input
    if (!dsl || typeof dsl !== 'object') {
      return {
        error: true,
        message: 'DSL must be an object',
        sql: null
      };
    }

    if (!Array.isArray(dsl.conditions)) {
      return {
        error: true,
        message: 'DSL conditions must be an array',
        sql: null
      };
    }

    // Base query with joins
    let baseQuery = `
    SELECT 
      s.symbol, 
      s.company_name, 
      s.sector,
      s.industry,
      s.market_cap,
      f.pe_ratio,
      f.pb_ratio,
      f.peg_ratio,
      f.debt_to_equity_ratio as debt_to_equity,
      ROUND(CAST(f.return_on_equity * 100 AS numeric), 2) as roe,
      ROUND(CAST(f.dividend_yield * 100 AS numeric), 2) as dividend_yield,
      f.eps,
      f.book_value_per_share,
      ROUND(CAST(f.profit_margin * 100 AS numeric), 2) as profit_margin,
      ROUND(CAST(f.operating_margin * 100 AS numeric), 2) as operating_margin,
      ROUND(CAST(f.return_on_assets * 100 AS numeric), 2) as return_on_assets,
      f.current_ratio,
      f.quick_ratio,
      f.beta,
      ROUND(CAST(sh.promoter_holding_percentage AS numeric), 2) as promoter_holding
    FROM stocks s
    LEFT JOIN fundamentals f ON s.symbol = f.symbol
    LEFT JOIN shareholding sh ON s.symbol = sh.symbol
    WHERE s.is_active = TRUE
  `;

    // Add sector filter with mapping and case-insensitive matching
    if (dsl.sector && typeof dsl.sector === 'string') {
      // Map LLM sector to database sector
      const mappedSector = SECTOR_MAPPING[dsl.sector] || dsl.sector;
      const safeSector = mappedSector.replace(/'/g, "''").replace(/[;\\]/g, '');
      baseQuery += ` AND UPPER(s.sector) = UPPER('${safeSector}')`;
    }

    // Add condition filters
    dsl.conditions.forEach((cond, index) => {
      const tableAlias = FIELD_TO_TABLE[cond.field] || 's';
      
      // Validate operator to prevent SQL injection
      const validOperators = ['<', '>', '<=', '>=', '=', '!='];
      if (!validOperators.includes(cond.operator)) {
        throw new Error(`Invalid operator: ${cond.operator}`);
      }
      
      // Convert percentage values from whole numbers (20) to decimals (0.2) for database
      let queryValue = cond.value;
      if (PERCENTAGE_FIELDS.includes(cond.field) && typeof cond.value === 'number') {
        queryValue = cond.value / 100; // Convert 20 to 0.2
      }
      
      const safeValue = escapeSQLValue(queryValue);
      
      // For percentage fields with equality operator, use a small tolerance range
      // to handle floating-point precision issues
      if (PERCENTAGE_FIELDS.includes(cond.field) && cond.operator === '=' && typeof queryValue === 'number') {
        const tolerance = 0.02; // 2% tolerance (in decimal form)
        const lowerBound = queryValue - tolerance;
        const upperBound = queryValue + tolerance;
        baseQuery += ` AND ${tableAlias}.${cond.field} BETWEEN ${lowerBound} AND ${upperBound}`;
      } else {
        baseQuery += ` AND ${tableAlias}.${cond.field} ${cond.operator} ${safeValue}`;
      }
    });

    // Add ordering
    baseQuery += `\n    ORDER BY s.symbol ASC`;

    // Add limit for safety
    baseQuery += `\n    LIMIT 100`;

    return {
      error: false,
      sql: baseQuery.trim(),
      message: 'SQL compiled successfully'
    };

  } catch (error) {
    console.error('SQL compilation error:', error);
    return {
      error: true,
      message: 'Failed to compile DSL to SQL',
      details: error.message,
      sql: null
    };
  }
}

module.exports = { compileDSLToSQL, escapeSQLValue, FIELD_TO_TABLE, PERCENTAGE_FIELDS };
