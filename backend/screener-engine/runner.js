const db = require('./db');

async function runSQL(sql) {
  const result = await db.query(sql);
  return result.rows;
}

module.exports = { runSQL };
