function compileToSQL(dsl) {
  const conditions = dsl.filters.map(
    f => `${f.field} ${f.operator} ${f.value}`
  );

  return `
    SELECT symbol, company, pe, roe
    FROM stocks
    WHERE ${conditions.join(` ${dsl.logic} `)}
  `;
}

module.exports = { compileToSQL };
