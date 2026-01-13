// Valid database fields across all tables
const VALID_FIELDS = [
  // Fundamentals table
  'pe_ratio', 'peg_ratio', 'pb_ratio', 'ps_ratio', 'dividend_yield', 'beta',
  'eps', 'book_value_per_share', 'profit_margin', 'operating_margin',
  'return_on_equity', 'return_on_assets', 'current_ratio', 'quick_ratio',
  'interest_coverage', 'debt_to_equity_ratio', 'total_debt', 'free_cash_flow',
  'debt_to_fcf_ratio',
  // Shareholding table
  'promoter_holding_percentage', 'institutional_holding_percentage',
  'public_holding_percentage', 'foreign_institutional_holding',
  'domestic_institutional_holding', 'mutual_fund_holding', 'retail_holding',
  'promoter_pledge_percentage',
  // Stocks table
  'market_cap', 'employees', 'average_volume', 'shares_outstanding',
  'insider_ownership_percentage', 'institutional_ownership_percentage',
  // Financials table (for aggregated queries)
  'revenue', 'ebitda', 'revenue_yoy_growth', 'ebitda_yoy_growth',
  'gross_profit', 'operating_income', 'net_income', 'gross_margin',
  'operating_margin', 'net_margin', 'eps_basic', 'eps_diluted'
];

const VALID_OPERATORS = ['<', '>', '<=', '>=', '=', '!='];
const VALID_SECTORS = ['IT', 'Technology', 'Software', 'Hardware', 'Telecom', 'Finance', 'Healthcare'];

/**
 * Validates the DSL structure to ensure it's safe for SQL compilation
 * @param {Object} dsl - The DSL object to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateDSL(dsl) {
  const errors = [];

  // Check basic structure
  if (!dsl || typeof dsl !== 'object') {
    return { valid: false, errors: ['DSL must be an object'] };
  }

  // Validate sector if provided
  if (dsl.sector && typeof dsl.sector !== 'string') {
    errors.push('Sector must be a string');
  }

  // Validate conditions array
  if (!Array.isArray(dsl.conditions)) {
    return { valid: false, errors: ['Conditions must be an array'] };
  }

  // Validate each condition
  dsl.conditions.forEach((condition, index) => {
    if (!condition.field || typeof condition.field !== 'string') {
      errors.push(`Condition ${index}: field is required and must be a string`);
    } else if (!VALID_FIELDS.includes(condition.field)) {
      errors.push(`Condition ${index}: invalid field '${condition.field}'. Must be one of: ${VALID_FIELDS.join(', ')}`);
    }

    if (!condition.operator || typeof condition.operator !== 'string') {
      errors.push(`Condition ${index}: operator is required and must be a string`);
    } else if (!VALID_OPERATORS.includes(condition.operator)) {
      errors.push(`Condition ${index}: invalid operator '${condition.operator}'. Must be one of: ${VALID_OPERATORS.join(', ')}`);
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push(`Condition ${index}: value is required`);
    } else if (typeof condition.value !== 'number' && typeof condition.value !== 'string') {
      errors.push(`Condition ${index}: value must be a number or string`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Parses user query into DSL format with error handling
 * @param {string} query - User's natural language query
 * @returns {Object} - DSL object or error object
 */
function parseQueryToDSL(query) {
  try {
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        error: true,
        message: 'Query must be a non-empty string',
        dsl: null
      };
    }

    // Simple keyword-based parsing (Sprint-2 level)
    const dsl = {
      sector: null,
      conditions: []
    };

    const lowerQuery = query.toLowerCase();

    // Parse sector
    if (lowerQuery.includes("it") || lowerQuery.includes("technology")) {
      dsl.sector = "IT";
    } else if (lowerQuery.includes("software")) {
      dsl.sector = "Software";
    } else if (lowerQuery.includes("hardware")) {
      dsl.sector = "Hardware";
    }

    // Parse PEG ratio conditions
    if (lowerQuery.includes("peg")) {
      const pegMatch = query.match(/peg.*?(less than|below|<)\s*(\d+\.?\d*)/i);
      const pegValue = pegMatch ? parseFloat(pegMatch[2]) : 3;
      dsl.conditions.push({
        field: "peg_ratio",
        operator: "<",
        value: pegValue
      });
    }

    // Parse PE ratio conditions
    if (lowerQuery.includes("pe") && !lowerQuery.includes("peg")) {
      const peMatch = query.match(/pe.*?(less than|below|<)\s*(\d+\.?\d*)/i);
      const peValue = peMatch ? parseFloat(peMatch[2]) : 15;
      dsl.conditions.push({
        field: "pe_ratio",
        operator: "<",
        value: peValue
      });
    }

    // Parse promoter holding conditions
    if (lowerQuery.includes("promoter")) {
      const promoterMatch = query.match(/promoter.*?(above|greater than|>)\s*(\d+\.?\d*)/i);
      const promoterValue = promoterMatch ? parseFloat(promoterMatch[2]) : 50;
      dsl.conditions.push({
        field: "promoter_holding_percentage",
        operator: ">",
        value: promoterValue
      });
    }

    // Parse debt conditions
    if (lowerQuery.includes("debt")) {
      dsl.conditions.push({
        field: "debt_to_fcf_ratio",
        operator: "<",
        value: 0.25
      });
    }

    // Parse dividend yield
    if (lowerQuery.includes("dividend")) {
      const divMatch = query.match(/dividend.*?(above|greater than|>)\s*(\d+\.?\d*)/i);
      const divValue = divMatch ? parseFloat(divMatch[2]) : 2;
      dsl.conditions.push({
        field: "dividend_yield",
        operator: ">",
        value: divValue
      });
    }

    // Validate the generated DSL
    const validation = validateDSL(dsl);
    if (!validation.valid) {
      return {
        error: true,
        message: 'Generated DSL is invalid',
        validationErrors: validation.errors,
        dsl: null
      };
    }

    return {
      error: false,
      dsl,
      message: 'Query parsed successfully'
    };

  } catch (error) {
    console.error('Error parsing query:', error);
    return {
      error: true,
      message: 'Failed to parse query',
      details: error.message,
      dsl: null
    };
  }
}

/**
 * Future: Parse query using OpenAI with retry logic
 * @param {string} query - User's natural language query
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - DSL object or error
 */
async function parseWithLLM(query, maxRetries = 3) {
  // TODO: Implement when OpenAI integration is added
  // This will replace parseQueryToDSL for production use
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Placeholder for OpenAI API call
      // const response = await openai.chat.completions.create({...});
      // const dsl = JSON.parse(response.choices[0].message.content);
      
      // For now, fallback to keyword parsing
      const result = parseQueryToDSL(query);
      
      if (!result.error) {
        return result;
      }
      
      console.warn(`LLM parse attempt ${attempt} failed:`, result.message);
      
    } catch (error) {
      console.error(`LLM attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        return {
          error: true,
          message: `LLM failed after ${maxRetries} attempts`,
          details: error.message,
          dsl: null
        };
      }
    }
  }
}

module.exports = { 
  parseQueryToDSL, 
  validateDSL, 
  parseWithLLM,
  VALID_FIELDS,
  VALID_OPERATORS,
  VALID_SECTORS
};
