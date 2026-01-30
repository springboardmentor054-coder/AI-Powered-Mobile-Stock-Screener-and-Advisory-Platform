
function compile(filters){
 let sql = `SELECT * FROM stocks WHERE sector='IT'`;

 if(filters.pe)
  sql += ` AND pe < ${filters.pe}`;

 if(filters.peg)
  sql += ` AND peg < ${filters.peg}`;

 if(filters.promoter)
  sql += ` AND promoter_holding > ${filters.promoter}`;

 if(filters.buyback)
  sql += ` AND buyback = true`;

 sql += `
 AND (debt/free_cash_flow) < 4
 AND revenue_growth > 0
 AND ebitda_growth > 0
 AND current_price < analyst_target
 AND next_earnings BETWEEN NOW() AND NOW() + INTERVAL '30 days'
 `;

 return sql;
}
module.exports = compile;
