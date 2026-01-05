function parseQueryToDSL(query) {
  // Simple keyword-based parsing (Sprint-2 level)
  const dsl = {
    sector: null,
    conditions: []
  };

  if (query.toLowerCase().includes("it")) {
    dsl.sector = "IT";
  }

  if (query.toLowerCase().includes("peg")) {
    dsl.conditions.push({
      field: "peg_ratio",
      operator: "<",
      value: 3
    });
  }

  if (query.toLowerCase().includes("promoter")) {
    dsl.conditions.push({
      field: "promoter_holding_percentage",
      operator: ">",
      value: 50
    });
  }

  return dsl;
}

module.exports = { parseQueryToDSL };
