const OpenAI = require("openai");

/**
 * Toggle this flag
 */
const USE_OPENAI = false;

let client = null;

if (USE_OPENAI) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Converts natural language stock query into structured DSL
 */
async function parseQuery(userQuery) {
  // 🟢 MOCK MODE — rule-based parsing
  if (!USE_OPENAI) {
    const query = userQuery.toLowerCase();

    let sector = null;
    let filters = [];

    // Sector detection
    if (query.includes("it")) sector = "IT";
    else if (query.includes("bank")) sector = "Banking";
    else if (query.includes("pharma")) sector = "Pharma";

    // PE ratio detection
    const peMatch = query.match(/pe\s*(less than|below|<)\s*(\d+)/);
    if (peMatch) {
      filters.push({
        field: "pe_ratio",
        operator: "<",
        value: Number(peMatch[2]),
      });
    }

    return { sector, filters };
  }

  // 🔵 REAL OPENAI MODE
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
Convert stock screening queries into STRICT JSON.

Allowed fields:
- sector
- pe_ratio
- pb_ratio
- debt_to_equity

Return ONLY JSON in this format:
{
  "sector": string | null,
  "filters": [
    { "field": string, "operator": string, "value": number }
  ]
}
          `,
        },
        { role: "user", content: userQuery },
      ],
    });

    return JSON.parse(response.choices[0].message.content.trim());
  } catch (err) {
    console.error("LLM Parsing failed:", err);
    throw new Error("Invalid query format");
  }
}

module.exports = parseQuery;