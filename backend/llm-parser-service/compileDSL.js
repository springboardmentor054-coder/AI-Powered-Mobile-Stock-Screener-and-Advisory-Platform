function compileDSL(dsl) {
  let sql = `
    SELECT c.symbol, f.pe_ratio 
    FROM companies c 
    JOIN fundamentals f ON c.id=f.company_id 
    WHERE 1=1
  `;

  dsl.filters.forEach(f => {
    sql += ` AND ${f.field} ${f.operator} ${f.value}`;
  });

  return sql;
}

module.exports = compileDSL;
