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
  'institutional_ownership_percentage': 's',
  // Quarterly financials table (for time-based queries)
  'quarter': 'qf', 'revenue': 'qf', 'net_income': 'qf', 
  'gross_profit': 'qf', 'operating_income': 'qf', 'company_id': 'qf'
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

    // Check if this is a time-based query requiring GROUP BY
    const needsQuarterlyJoin = dsl.timeFilters || dsl.groupBy || dsl.having;
    
    // Base query with joins
    let baseQuery = '';
    
    if (needsQuarterlyJoin && dsl.groupBy) {
      // Time-based query with grouping
      baseQuery = `
    SELECT 
      s.symbol,
      s.symbol as company_id,
      s.company_name, 
      s.sector,
      COUNT(qf.quarter) as quarter_count`;
      
      // Add aggregate functions if specified in groupBy
      if (dsl.groupBy.aggregates) {
        dsl.groupBy.aggregates.forEach(agg => {
          const tableAlias = FIELD_TO_TABLE[agg.field] || 'qf';
          baseQuery += `,
      ${agg.function.toUpperCase()}(${tableAlias}.${agg.field}) as ${agg.alias || (agg.function + '_' + agg.field)}`;
        });
      }
      
      baseQuery += `
    FROM stocks s
    INNER JOIN quarterly_financials qf ON s.symbol = qf.symbol`;
    } else {
      // Standard query without grouping
      baseQuery = `
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
    LEFT JOIN shareholding sh ON s.symbol = sh.symbol`;
    }
    
    baseQuery += `
    WHERE s.is_active = TRUE`;

    // Add time filters if present
    if (dsl.timeFilters) {
      if (dsl.timeFilters.quarterRange) {
        const { value, unit } = dsl.timeFilters.quarterRange;
        baseQuery += ` AND qf.quarter >= CURRENT_DATE - INTERVAL '${value} ${unit}'`;
      }
      if (dsl.timeFilters.dateFrom) {
        baseQuery += ` AND qf.quarter >= '${dsl.timeFilters.dateFrom}'`;
      }
      if (dsl.timeFilters.dateTo) {
        baseQuery += ` AND qf.quarter <= '${dsl.timeFilters.dateTo}'`;
      }
    }
    
    // Add sector filter with mapping and case-insensitive matching
    if (dsl.sector && typeof dsl.sector === 'string') {
      // Map LLM sector to database sector
      const mappedSector = SECTOR_MAPPING[dsl.sector] || dsl.sector;
      const safeSector = mappedSector.replace(/'/g, "''").replace(/[;\\]/g, '');
      baseQuery += ` AND UPPER(s.sector) = UPPER('${safeSector}')`;
    }

    // Add symbol filter (exact match)
    if (dsl.symbol && typeof dsl.symbol === 'string') {
      const safeSymbol = dsl.symbol.replace(/'/g, "''").replace(/[;\\]/g, '');
      baseQuery += ` AND UPPER(s.symbol) = UPPER('${safeSymbol}')`;
    }

    // Add company name filter (partial match)
    if (dsl.companyName && typeof dsl.companyName === 'string') {
      const safeName = dsl.companyName.replace(/'/g, "''").replace(/[;\\]/g, '').replace(/%/g, '');
      baseQuery += ` AND s.company_name ILIKE '%${safeName}%'`;
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
    
    // Add GROUP BY clause if present
    if (dsl.groupBy && dsl.groupBy.fields) {
      baseQuery += `\n    GROUP BY `;
      const groupFields = dsl.groupBy.fields.map(field => {
        const tableAlias = FIELD_TO_TABLE[field] || 's';
        return `${tableAlias}.${field}`;
      });
      baseQuery += groupFields.join(', ');
      
      // Add non-aggregated SELECT fields to GROUP BY
      if (needsQuarterlyJoin) {
        baseQuery += `, s.symbol, s.company_name, s.sector`;
      }
    }
    
    // Add HAVING clause if present
    if (dsl.having && Array.isArray(dsl.having)) {
      baseQuery += `\n    HAVING `;
      const havingConditions = dsl.having.map((cond, index) => {
        const validOperators = ['<', '>', '<=', '>=', '=', '!='];
        if (!validOperators.includes(cond.operator)) {
          throw new Error(`Invalid operator in HAVING: ${cond.operator}`);
        }
        
        // Handle aggregate functions in HAVING
        let havingExpression;
        if (cond.aggregate) {
          const tableAlias = FIELD_TO_TABLE[cond.field] || 'qf';
          havingExpression = `${cond.aggregate.toUpperCase()}(${tableAlias}.${cond.field})`;
        } else if (cond.expression) {
          // Direct expression like COUNT(*)
          havingExpression = cond.expression;
        } else {
          havingExpression = cond.field;
        }
        
        const safeValue = escapeSQLValue(cond.value);
        return `${havingExpression} ${cond.operator} ${safeValue}`;
      });
      baseQuery += havingConditions.join(' AND ');
    }

    // Add ordering
    if (dsl.groupBy) {
      baseQuery += `\n    ORDER BY quarter_count DESC, s.symbol ASC`;
    } else {
      baseQuery += `\n    ORDER BY s.symbol ASC`;
    }

    // Add limit for safety (increased to show all stocks)
    baseQuery += `\n    LIMIT 500`;

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
