const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function parseQuery(query) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return ONLY JSON rules" },
      { role: "user", content: query }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = parseQuery;
