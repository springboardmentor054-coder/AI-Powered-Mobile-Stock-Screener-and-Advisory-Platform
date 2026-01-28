require("dotenv").config();
const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables');
  throw new Error('GROQ_API_KEY is required');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Parses natural language query to structured DSL JSON
 * 
 * @param {string} query - Natural language query (e.g., "Show IT stocks with PE below 5")
 * @returns {Promise<Object>} DSL JSON object
 */
async function parseQuery(query) {
  console.log("Parsing query:", query);

  const systemPrompt = `You are a stock screener DSL generator. Convert natural language to JSON only.

Output format (strict JSON, no text):
{
  "sector": "IT" | "Finance" | "Healthcare" | etc,
  "filters": [
    { "field": "pe_ratio" | "peg_ratio" | "debt_to_fcf", "operator": "<" | ">" | "<=" | ">=" | "=", "value": number }
  ],
  "last_quarters": number (optional)
}

Rules:
- Only output valid JSON, nothing else
- sector is optional
- filters is array of objects
- last_quarters is optional
- Allowed fields: pe_ratio, peg_ratio, debt_to_fcf
- Allowed operators: <, >, <=, >=, =`;

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

    const content = completion.choices[0].message.content.trim();
    console.log("LLM Response:", content);

    // Parse JSON response
    let dsl;
    try {
      dsl = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("LLM did not return valid JSON");
    }

    console.log("Parsed DSL:", JSON.stringify(dsl, null, 2));
    return dsl;
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error(`Failed to parse query: ${error.message}`);
  }
}

module.exports = { parseQuery };
