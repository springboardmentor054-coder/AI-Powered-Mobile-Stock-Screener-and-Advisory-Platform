// backend/utils/aiHandler.js
const { getLLMProvider } = require('./llmProviders');
const { buildSystemPrompt } = require('./llmPrompt');
const { parseAndValidate } = require('./dslParser');

async function processUserQuery(userQuery) {
  try {
    // 1. Initialize AI Provider
    const llm = getLLMProvider();

    // 2. Build Dynamic Instructions
    const prompt = buildSystemPrompt();

    // 3. Get Raw Response from AI
    const rawResponse = await llm.query(prompt, userQuery);
    console.log("🤖 Raw AI Response:", rawResponse);

    // 4. Validate and Parse into clean DSL
    const safeDSL = parseAndValidate(rawResponse);

    return safeDSL;

  } catch (error) {
    console.error("AI Handler Error:", error.message);
    throw error;
  }
}

module.exports = { processUserQuery };