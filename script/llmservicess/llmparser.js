const Groq = require("groq-sdk");

// Initialize Groq client lazily so env can be loaded first
let groqClient = null;
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
};

// Valid database fields from stocks_raw_upload
const VALID_FIELDS = [
  "name",
  "screener",
  "ltp",
  "change_pct",
  "open",
  "volume",
  "market_cap_cr",
  "pe_ratio",
  "industry_pe",
  "high_52w",
  "low_52w",
  "return_1m",
  "return_3m",
  "return_1y",
  "return_3y",
  "return_5y",
  "pb_ratio",
  "dividend",
  "roe",
  "roce",
  "eps",
  "dma_50",
  "dma_200",
  "rsi",
  "margin_funding",
  "margin_pledge",
  "uploaded_at",
];

const VALID_OPERATORS = ["<", ">", "<=", ">=", "=", "!="];
const VALID_SECTORS = [];

/**
 * System prompt for the LLM to convert natural language to DSL
 */
const SYSTEM_PROMPT = `You are a stock screener query parser. Convert natural language queries into a structured DSL format.

Database Schema:
- stocks_raw_upload: name, screener, ltp, change_pct, open, volume, market_cap_cr, pe_ratio, industry_pe, high_52w, low_52w, return_1m, return_3m, return_1y, return_3y, return_5y, pb_ratio, dividend, roe, roce, eps, dma_50, dma_200, rsi, margin_funding, margin_pledge, uploaded_at

Column meanings (best-guess defaults):
- name: company name
- screener: screener name/tag
- ltp: last traded price
- change_pct: percent price change
- open: opening price
- volume: trading volume
- market_cap_cr: market cap in crores
- pe_ratio: price to earnings ratio
- industry_pe: industry PE benchmark
- high_52w: 52-week high price
- low_52w: 52-week low price
- return_1m: 1-month return percent
- return_3m: 3-month return percent
- return_1y: 1-year return percent
- return_3y: 3-year return percent
- return_5y: 5-year return percent
- pb_ratio: price to book ratio
- dividend: dividend yield percent
- roe: return on equity percent
- roce: return on capital employed percent
- eps: earnings per share
- dma_50: 50-day moving average
- dma_200: 200-day moving average
- rsi: relative strength index
- margin_funding: margin funding value
- margin_pledge: margin pledge value
- uploaded_at: upload timestamp

Valid operators: <, >, <=, >=, =, !=

Output JSON format:
{
  "name": "string or null",
  "screener": "string or null",
  "conditions": [
    {
      "field": "field_name",
      "operator": "< or > or = etc",
      "value": number or string
    }
  ],
  "timeFilters": {
    "quarterRange": {
      "value": number,
      "unit": "months or years or days"
    },
    "dateFrom": "YYYY-MM-DD",
    "dateTo": "YYYY-MM-DD"
  },
  "groupBy": {
    "fields": ["company_id"],
    "aggregates": [
      {
        "function": "COUNT or MIN or MAX or AVG or SUM",
        "field": "field_name",
        "alias": "optional_alias"
      }
    ]
  },
  "having": [
    {
      "expression": "COUNT(*) or other aggregate",
      "aggregate": "MIN or MAX or COUNT",
      "field": "field_name",
      "operator": "< or > or = etc",
      "value": number
    }
  ],
  "specialFilters": {
    "hasUpcomingEarnings": boolean,
    "earningsWithinDays": number,
    "hasStockBuyback": boolean,
    "minAnalystCount": number
  }
}

Examples:

Query: "show stock named TCS"
Output: {"name": "TCS", "screener": null, "conditions": [], "specialFilters": {}}

Query: "show all stocks"
Output: {"name": null, "screener": null, "conditions": [], "specialFilters": {}}

Query: "stocks with PE ratio less than 15"
Output: {"name": null, "screener": null, "conditions": [{"field": "pe_ratio", "operator": "<", "value": 15}], "specialFilters": {}}

Query: "stocks with ROCE above 15 and market cap above 200000"
Output: {"name": null, "screener": null, "conditions": [{"field": "roce", "operator": ">", "value": 15}, {"field": "market_cap_cr", "operator": ">", "value": 200000}], "specialFilters": {}}

IMPORTANT: 
- If query mentions a specific stock name, extract it into "name" field
- If query mentions a screener name, extract it into "screener" field
- Only use fields from the schema above
- Always return valid JSON
- Return empty specialFilters object if no special filters needed`;

/**
 * Validates the DSL structure
 */
function validateDSL(dsl) {
  const errors = [];

  if (!dsl || typeof dsl !== "object") {
    return { valid: false, errors: ["DSL must be an object"] };
  }

  // Validate conditions
  if (!Array.isArray(dsl.conditions)) {
    return { valid: false, errors: ["Conditions must be an array"] };
  }

  dsl.conditions.forEach((condition, index) => {
    if (!VALID_FIELDS.includes(condition.field)) {
      errors.push(`Condition ${index}: invalid field '${condition.field}'`);
    }
    if (!VALID_OPERATORS.includes(condition.operator)) {
      errors.push(
        `Condition ${index}: invalid operator '${condition.operator}'`,
      );
    }
    if (condition.value === undefined || condition.value === null) {
      errors.push(`Condition ${index}: value is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parses user query into DSL format using OpenAI GPT
 */
async function parseQueryToDSL(query) {
  try {
    // Validate input
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return {
        error: true,
        message: "Query must be a non-empty string",
        dsl: null,
      };
    }

    // Check if Groq API key is configured
    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "your-groq-api-key-here"
    ) {
      console.warn("Groq API key not configured, using fallback parser");
      return fallbackParser(query);
    }

    console.log(`Parsing query with LLM: "${query}"`);

    // Call Groq API (FREE!)
    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast, free, powerful model
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Parse this stock screener query: "${query}"`,
        },
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    // Extract DSL from response
    const responseText = completion.choices[0].message.content;
    const dsl = JSON.parse(responseText);

    // Ensure specialFilters exists
    if (!dsl.specialFilters) {
      dsl.specialFilters = {};
    }

    // Validate the generated DSL
    const validation = validateDSL(dsl);
    if (!validation.valid) {
      return {
        error: true,
        message: "LLM generated invalid DSL",
        validationErrors: validation.errors,
        dsl: null,
      };
    }

    console.log("✓ Successfully parsed query with LLM");
    return {
      error: false,
      dsl,
      message: "Query parsed successfully",
      usedLLM: true,
    };
  } catch (error) {
    console.error("Error parsing query with LLM:", error.message);

    // Fallback to simple parser if LLM fails
    console.log("Falling back to simple parser...");
    return fallbackParser(query);
  }
}

/**
 * Fallback parser using simple keyword matching (when LLM is unavailable)
 */
function fallbackParser(query) {
  try {
    const dsl = {
      name: null,
      screener: null,
      conditions: [],
      specialFilters: {},
    };

    const lowerQuery = query.toLowerCase();

    // Parse PE ratio
    if (lowerQuery.includes("pe") && !lowerQuery.includes("peg")) {
      const peMatch = query.match(/pe.*?(less than|below|<)\s*(\d+\.?\d*)/i);
      const peValue = peMatch ? parseFloat(peMatch[2]) : 15;
      dsl.conditions.push({
        field: "pe_ratio",
        operator: "<",
        value: peValue,
      });
    }
    // Parse ROE
    if (lowerQuery.includes("roe")) {
      const roeMatch = query.match(
        /roe.*?(above|greater than|>)\s*(\d+\.?\d*)/i,
      );
      const roeValue = roeMatch ? parseFloat(roeMatch[2]) : 15;
      dsl.conditions.push({
        field: "roe",
        operator: ">",
        value: roeValue,
      });
    }

    // Parse ROCE
    if (lowerQuery.includes("roce")) {
      const roceMatch = query.match(
        /roce.*?(above|greater than|>)\s*(\d+\.?\d*)/i,
      );
      const roceValue = roceMatch ? parseFloat(roceMatch[2]) : 15;
      dsl.conditions.push({
        field: "roce",
        operator: ">",
        value: roceValue,
      });
    }

    // Parse dividend
    if (lowerQuery.includes("dividend")) {
      const dividendMatch = query.match(
        /dividend.*?(above|greater than|>)\s*(\d+\.?\d*)/i,
      );
      const dividendValue = dividendMatch ? parseFloat(dividendMatch[2]) : 3;
      dsl.conditions.push({
        field: "dividend",
        operator: ">",
        value: dividendValue,
      });
    }

    // Parse market cap
    if (lowerQuery.includes("market cap") || lowerQuery.includes("marketcap")) {
      const marketCapMatch = query.match(
        /market\s*cap.*?(above|greater than|>)\s*(\d+\.?\d*)/i,
      );
      const marketCapValue = marketCapMatch ? parseFloat(marketCapMatch[2]) : 0;
      dsl.conditions.push({
        field: "market_cap_cr",
        operator: ">",
        value: marketCapValue,
      });
    }

    // Validate
    const validation = validateDSL(dsl);
    if (!validation.valid) {
      return {
        error: true,
        message: "Generated DSL is invalid",
        validationErrors: validation.errors,
        dsl: null,
      };
    }

    return {
      error: false,
      dsl,
      message: "Query parsed successfully (fallback parser)",
      usedLLM: false,
    };
  } catch (error) {
    console.error("Error in fallback parser:", error);
    return {
      error: true,
      message: "Failed to parse query",
      details: error.message,
      dsl: null,
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
          dsl: null,
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
  VALID_SECTORS,
};
