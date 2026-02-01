require("dotenv").config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_URL = "https://router.huggingface.co/v1/chat/completions";

/* =========================
   SAFE JSON EXTRACTOR
========================= */
function extractJSON(text) {
  // remove code fences if any
  text = text.replace(/```json|```/gi, "").trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON found in AI response");
  }

  const jsonString = text.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

/* =========================
   LLM PARSER
========================= */
async function parseQueryToJSON(userQuery) {
  const response = await fetch(HF_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "Convert stock screening queries into STRICT JSON only. Do not add explanations."
        },
        {
          role: "user",
          content: `
Allowed fields:
- sector
- pe_ratio
- roe
- peg_ratio
- promoter_holding
- last_n_quarters_positive

Use lt / gt / eq for numeric filters.

Query:
"${userQuery}"
`
        }
      ],
      temperature: 0
    })
  });

  const rawText = await response.text();
  console.log("🧠 RAW AI RESPONSE:\n", rawText);

  if (!response.ok) {
    throw new Error(`HF API Error: ${rawText}`);
  }

  const parsed = JSON.parse(rawText);
  const aiText = parsed?.choices?.[0]?.message?.content;

  if (!aiText) {
    throw new Error("No AI content returned");
  }

  const json = extractJSON(aiText);
  console.log("🟢 EXTRACTED JSON:", json);

  return json;
}

module.exports = { parseQueryToJSON };
