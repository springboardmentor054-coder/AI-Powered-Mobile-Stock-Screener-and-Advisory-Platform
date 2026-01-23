module.exports = function compileDSL(dsl) {
  let sql = "SELECT * FROM companies c JOIN fundamentals f ON c.id=f.company_id WHERE 1=1";

  if (dsl.sector) {
    sql += ` AND c.sector='${dsl.sector}'`;
  }

  dsl.filters.forEach(f => {
    sql += ` AND ${f.field} ${f.operator} ${f.value}`;
  });

  return sql;
};
