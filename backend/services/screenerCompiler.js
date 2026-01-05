function compileDSLToSQL(dsl) {
  let baseQuery = `
    SELECT s.symbol, s.company_name
    FROM stocks s
    JOIN fundamentals f ON s.symbol = f.symbol
    JOIN shareholding sh ON s.symbol = sh.symbol
    WHERE 1=1
  `;

  if (dsl.sector) {
    baseQuery += ` AND s.sector = '${dsl.sector}'`;
  }

  dsl.conditions.forEach(cond => {
    baseQuery += ` AND ${cond.field} ${cond.operator} ${cond.value}`;
  });

  return baseQuery;
}

module.exports = { compileDSLToSQL };
