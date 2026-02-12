const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function parseQuery(query) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Convert stock screening query into JSON DSL.

Supported metrics:
- pe_ratio
- market_cap
- dividend_yield
- eps

Example:
Input: "pe ratio less than 20"

Output:
{
  "metric": "pe_ratio",
  "operator": "<",
  "value": 20
}

Return ONLY JSON.
`
      },
      { role: "user", content: query }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = parseQuery;
