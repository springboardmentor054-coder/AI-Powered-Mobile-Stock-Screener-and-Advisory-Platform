// backend/utils/llmProviders.js
const Groq = require("groq-sdk");
require("dotenv").config();

// --- Provider 1: Groq ---
class GroqProvider {
  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async query(systemPrompt, userText) {
    try {
      const response = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        temperature: 0.1, // Low temperature = more precise JSON
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error("Failed to communicate with AI Provider");
    }
  }
}

// --- Factory Function ---
function getLLMProvider() {
  // You can switch this based on .env later (e.g., process.env.AI_PROVIDER)
  return new GroqProvider();
}

module.exports = { getLLMProvider };