function parseQuery(query) {
  query = query.toLowerCase().trim();

  // Mapping natural phrases
  query = query.replace("less than", "<");
  query = query.replace("greater than", ">");
  query = query.replace("below", "<");
  query = query.replace("above", ">");

  // Extract operator
  const operators = ["<=", ">=", "!=", "<", ">", "="];
  let op = operators.find(o => query.includes(o));

  if (!op) throw new Error("Invalid operator in query");

  const [field, value] = query.split(op).map(s => s.trim());

  return {
    exchange: "NSE",
    filters: [
      { field, op, value: Number(value) }
    ],
    limit: 50
  };
}

module.exports = { parseQuery };
