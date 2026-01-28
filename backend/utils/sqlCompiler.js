const { FIELD_MAP } = require('./schemaMap');

function compileToSQL(dsl) {
  // 1. SELECT Clause
  let selectClause = [
    "companies.ticker_symbol", 
    "companies.company_name", 
    "companies.sector", 
    "companies.market_cap",
    "companies.description",
    "price_market_data.current_price",
    "price_market_data.price_change_percent"
  ];

  let fromClause = "FROM companies";
  
  // 2. JOIN Clause
  let joinClauses = new Set();
  joinClauses.add("LEFT JOIN price_market_data ON companies.id = price_market_data.company_id");

  let whereClauses = [];
  
  // Note: We removed the 'values' array and 'paramCounter' 
  // because we are putting values directly into the string.

  const addTableDependency = (field) => {
    const tableName = FIELD_MAP[field];
    if (!tableName) return null;

    if (tableName !== 'companies') {
      joinClauses.add(
        `LEFT JOIN ${tableName} ON companies.id = ${tableName}.company_id`
      );
    }
    
    const fullFieldName = `${tableName}.${field}`;
    if (!selectClause.includes(fullFieldName)) {
      selectClause.push(fullFieldName);
    }
    return fullFieldName;
  };

  // 3. Process CONDITIONS (Directly into String)
  if (dsl.conditions && Array.isArray(dsl.conditions)) {
    dsl.conditions.forEach(cond => {
      const fullFieldName = addTableDependency(cond.field);
      
      if (fullFieldName) {
        let finalValue = cond.value;

        // LOGIC: If it's text, wrap it in quotes ('Technology'). If number, leave it (20).
        if (typeof finalValue === 'string') {
          finalValue = `'${finalValue}'`; 
        }

        // Push the string directly: "pe_ratio < 20"
        whereClauses.push(`${fullFieldName} ${cond.operator} ${finalValue}`);
      }
    });
  }

  // 4. Process SORT
  let orderBy = "ORDER BY companies.market_cap DESC"; 
  if (dsl.sort && dsl.sort.field) {
    const fullFieldName = addTableDependency(dsl.sort.field);
    if (fullFieldName) {
      const direction = dsl.sort.direction === 'DESC' ? 'DESC' : 'ASC';
      orderBy = `ORDER BY ${fullFieldName} ${direction}`;
    }
  }

  // 5. Process LIMIT
  let limitVal = parseInt(dsl.limit) || 10;
  if (limitVal > 50) limitVal = 50;
  const limit = `LIMIT ${limitVal}`;

  // 6. Build Final SQL
  const joins = Array.from(joinClauses).join(" ");
  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const finalQuery = `
    SELECT ${selectClause.join(", ")}
    ${fromClause}
    ${joins}
    ${where}
    ${orderBy}
    ${limit};
  `;

  return {
    text: finalQuery.trim(),
    values: [] // Empty because values are now inside 'text'
  };
}

module.exports = { compileToSQL };