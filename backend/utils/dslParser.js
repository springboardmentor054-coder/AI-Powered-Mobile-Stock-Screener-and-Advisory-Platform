// backend/utils/dslParser.js
const { FIELD_MAP, VALID_OPERATORS } = require('./schemaMap');

function parseAndValidate(rawText) {
  // 1. Safe JSON Extraction (Handles cases where AI adds text around JSON)
  const jsonStart = rawText.indexOf("{");
  const jsonEnd = rawText.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("AI did not return valid JSON");
  }

  const jsonString = rawText.slice(jsonStart, jsonEnd + 1);
  let dsl;

  try {
    dsl = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Invalid JSON format in AI response");
  }

  // 2. Security & Logic Validation
  const validConditions = [];

  if (dsl.conditions && Array.isArray(dsl.conditions)) {
    for (const cond of dsl.conditions) {
      // Check if field exists in our Schema
      if (!FIELD_MAP[cond.field]) {
        console.warn(`⚠️ Dropping invalid field from AI: ${cond.field}`);
        continue;
      }

      // Check if operator is valid
      if (!VALID_OPERATORS.includes(cond.operator)) {
        cond.operator = "="; // Fallback to safe default
      }

      validConditions.push(cond);
    }
  }

  dsl.conditions = validConditions;
  return dsl;
}

module.exports = { parseAndValidate };