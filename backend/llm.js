require("dotenv").config();
const Groq = require("groq-sdk");

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const COMPARISON_PATTERN =
  "(above|over|greater than|more than|at least|>=|below|under|less than|at most|<=|equal to|=)";

const fieldKeywordMap = {
  pe_ratio: ["pe", "p/e", "pe ratio"],
  market_cap_cr: ["market cap", "market capitalization", "mcap"],
  industry_pe: ["industry pe", "sector pe", "industry p/e"],
  pb_ratio: ["pb", "p/b", "pb ratio", "price to book"],
  roe: ["roe", "return on equity"],
  roce: ["roce", "return on capital employed"],
  eps: ["eps", "earnings per share"],
  ltp: ["ltp", "price", "current price"],
  change_pct: ["change", "change percent", "change %", "price change"],
  open: ["open", "opening price"],
  volume: ["volume", "traded volume"],
  return_1m: ["1m return", "one month return", "return 1m"],
  return_3m: ["3m return", "three month return", "return 3m"],
  return_1y: ["1y return", "one year return", "return 1y"],
  return_3y: ["3y return", "three year return", "return 3y"],
  return_5y: ["5y return", "five year return", "return 5y"],
  rsi: ["rsi", "relative strength index"],
  dividend: ["dividend", "dividend yield"],
  high_52w: ["52 week high", "52w high", "high 52w"],
  low_52w: ["52 week low", "52w low", "low 52w"],
  dma_50: ["50 dma", "50 day moving average", "dma 50"],
  dma_200: ["200 dma", "200 day moving average", "dma 200"],
  margin_funding: ["margin funding", "funding margin"],
  margin_pledge: ["margin pledge", "pledge margin"]
};

/**
 * Parses natural language query to structured DSL JSON
 * 
 * @param {string} query - Natural language query (e.g., "Show IT stocks with PE below 5")
 * @returns {Promise<Object>} DSL JSON object
 */
async function parseQuery(query) {
  console.log("Parsing query:", query);
  const fallbackDsl = parseQueryFallback(query);

  const systemPrompt = `You are a stock screener DSL generator. Convert natural language to JSON only.

Output format (strict JSON, no text):
{
  "filters": [
    { "field": "pe_ratio" | "market_cap_cr" | "industry_pe" | "pb_ratio" | "roe" | "roce" | "eps" | "ltp" | "change_pct" | "open" | "volume" | "return_1m" | "return_3m" | "return_1y" | "return_3y" | "return_5y" | "rsi" | "dividend" | "high_52w" | "low_52w" | "dma_50" | "dma_200" | "margin_funding" | "margin_pledge", "operator": "<" | ">" | "<=" | ">=" | "=", "value": number }
  ]
}

Rules:
- Only output valid JSON, nothing else
- filters is array of objects - ONLY add filters if explicitly mentioned in the query
- Allowed fields: pe_ratio, market_cap_cr, industry_pe, pb_ratio, roe, roce, eps, ltp, change_pct, open, volume, return_1m, return_3m, return_1y, return_3y, return_5y, rsi, dividend, high_52w, low_52w, dma_50, dma_200, margin_funding, margin_pledge
- Allowed operators: <, >, <=, >=, =
- DO NOT add filters that are not explicitly requested
- If no filter is explicitly provided, return {"filters": []}`;

  if (!groq) {
    console.warn("[LLM] GROQ_API_KEY missing. Using deterministic fallback parser.");
    return fallbackDsl;
  }

  try {
    console.log("Creating Groq completion with query:", query);
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        { 
          role: "user", 
          content: query 
        }
      ],
      temperature: 0,
      max_tokens: 200
    });
    
    console.log("Got completion response");

    const content = completion.choices[0]?.message?.content?.trim() || "";
    console.log("LLM Response:", content);

    // Parse JSON response
    let dsl;
    try {
      dsl = parseJsonFromCompletion(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      dsl = fallbackDsl;
    }

    console.log("Parsed DSL:", JSON.stringify(dsl, null, 2));
    return dsl;
  } catch (error) {
    console.error("LLM Error:", error);
    return fallbackDsl;
  }
}

function parseJsonFromCompletion(content) {
  if (!content) {
    return { filters: [] };
  }

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : content.trim();

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("No valid JSON object found in completion");
  }
}

function parseQueryFallback(query) {
  if (!query || typeof query !== "string") {
    return { filters: [] };
  }

  const normalizedQuery = query.toLowerCase();
  const filters = [];

  for (const [field, keywords] of Object.entries(fieldKeywordMap)) {
    const parsed = extractFilter(normalizedQuery, field, keywords);
    if (parsed) {
      filters.push(parsed);
    }
  }

  return { filters };
}

function extractFilter(query, field, keywords) {
  const alternation = keywords.map(escapeRegex).join("|");
  const withFieldFirst = new RegExp(
    `(?:${alternation})\\s*(?:ratio|value|index|percent|percentage|cap)?\\s*(?:is\\s*)?${COMPARISON_PATTERN}\\s*([\\d,.]+)`,
    "i"
  );
  const withOpFirst = new RegExp(
    `${COMPARISON_PATTERN}\\s*([\\d,.]+)\\s*(?:for\\s+)?(?:${alternation})`,
    "i"
  );

  const match = query.match(withFieldFirst) || query.match(withOpFirst);
  if (!match) {
    return null;
  }

  const operatorToken = (match[1] || "").toLowerCase().trim();
  const value = Number.parseFloat(String(match[2] || "").replace(/,/g, ""));
  if (!Number.isFinite(value)) {
    return null;
  }

  const operator = normalizeOperator(operatorToken);
  if (!operator) {
    return null;
  }

  return { field, operator, value };
}

function normalizeOperator(token) {
  if (token === ">" || token === "above" || token === "over" || token === "greater than" || token === "more than") {
    return ">";
  }
  if (token === "<" || token === "below" || token === "under" || token === "less than") {
    return "<";
  }
  if (token === ">=" || token === "at least") {
    return ">=";
  }
  if (token === "<=" || token === "at most") {
    return "<=";
  }
  if (token === "=" || token === "equal to") {
    return "=";
  }
  return null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { parseQuery };
