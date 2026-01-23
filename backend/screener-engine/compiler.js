function compileDSL(dsl) {
  const field = dsl.filters[0].field;
  const op = dsl.filters[0].op;
  const value = dsl.filters[0].value;

  return `
    SELECT symbol, company_name, pe
    FROM stocks_fundamentals
    WHERE exchange = '${dsl.exchange}'
    AND ${field} ${op} ${value}
    LIMIT ${dsl.limit};
  `;
}

module.exports = { compileDSL };
