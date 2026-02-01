const db = require("./db");

function normalize(val) {
  if (val?.lt !== undefined) return { op: "<", value: val.lt };
  if (val?.gt !== undefined) return { op: ">", value: val.gt };
  if (val?.eq !== undefined) return { op: "=", value: val.eq };
  return null;
}

function runScreener(filters) {
  return new Promise((resolve, reject) => {

    let query = `
      SELECT *
      FROM stocks
      WHERE 1 = 1

    `;
    const params = [];

    /* ======================
       BASIC FILTERS
    ====================== */

    if (filters.sector) {
      query += " AND sector = ?";
      params.push(filters.sector);
    }

    const fieldMap = {
      pe_ratio: "pe",
      roe: "roe",
      peg_ratio: "peg",
      promoter_holding: "promoter_holding"
    };

    Object.keys(fieldMap).forEach(key => {
      if (filters[key]) {
        const n = normalize(filters[key]);
        if (n) {
          query += ` AND ${fieldMap[key]} ${n.op} ?`;
          params.push(n.value);
        }
      }
    });

    /* ======================
       SPRINT 3: LAST N QUARTERS
    ====================== */

    if (filters.last_n_quarters_positive) {
      query += `
        AND name IN (
          SELECT stock_name
          FROM (
            SELECT stock_name, net_profit
            FROM quarterly_results
            ORDER BY year DESC, quarter DESC
          )
          GROUP BY stock_name
          HAVING COUNT(
            CASE WHEN net_profit > 0 THEN 1 END
          ) >= ?
        )
      `;
      params.push(filters.last_n_quarters_positive);
    }

    console.log("🧪 FINAL SQL:", query);
    console.log("🧪 PARAMS:", params);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("❌ DB ERROR:", err.message);
        reject(err);
      } else {
        console.log("📊 DB ROWS:", rows);
        resolve(rows);
      }
    });
  });
}

module.exports = runScreener;
