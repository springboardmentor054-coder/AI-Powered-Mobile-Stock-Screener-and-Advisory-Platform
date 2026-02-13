/**
 * DSL Validation Service
 * Validates incoming DSL JSON before compiling to SQL
 */

const ALLOWED_FIELDS = [
  "pe_ratio",
  "market_cap_cr",
  "industry_pe",
  "pb_ratio",
  "roe",
  "roce",
  "eps",
  "ltp",
  "change_pct",
  "open",
  "volume",
  "return_1m",
  "return_3m",
  "return_1y",
  "return_3y",
  "return_5y",
  "rsi",
  "dividend",
  "high_52w",
  "low_52w",
  "dma_50",
  "dma_200",
  "margin_funding",
  "margin_pledge"
];
const ALLOWED_OPERATORS = ["<", ">", "<=", ">=", "="];

/**
 * Validates DSL structure and fields
 * 
 * @param {Object} dsl - DSL object to validate
 * @throws {Error} If validation fails
 */
function validateDSL(dsl) {
  console.log("Validating DSL:", JSON.stringify(dsl, null, 2));

  if (!dsl || typeof dsl !== "object") {
    throw new Error("DSL must be an object");
  }

  // Validate filters (optional)
  if (dsl.filters !== undefined) {
    if (!Array.isArray(dsl.filters)) {
      throw new Error("filters must be an array");
    }

    dsl.filters.forEach((filter, index) => {
      // Validate filter structure
      if (!filter.field || !filter.operator || filter.value === undefined) {
        throw new Error(
          `Filter at index ${index} is missing required fields (field, operator, value)`
        );
      }

      // Validate field
      if (!ALLOWED_FIELDS.includes(filter.field)) {
        throw new Error(
          `Invalid field "${filter.field}" at index ${index}. Allowed fields: ${ALLOWED_FIELDS.join(
            ", "
          )}`
        );
      }

      // Validate operator
      if (!ALLOWED_OPERATORS.includes(filter.operator)) {
        throw new Error(
          `Invalid operator "${
            filter.operator
          }" at index ${index}. Allowed operators: ${ALLOWED_OPERATORS.join(
            ", "
          )}`
        );
      }

      // Validate value
      if (typeof filter.value !== "number") {
        throw new Error(
          `Value for "${filter.field}" at index ${index} must be a number`
        );
      }
    });
  }

  // Validate last_quarters (optional)
  if (dsl.last_quarters !== undefined) {
    if (typeof dsl.last_quarters !== "number" || dsl.last_quarters < 1) {
      throw new Error("last_quarters must be a positive number");
    }
  }

  console.log("DSL validation passed");
  return true;
}

module.exports = { validateDSL };
