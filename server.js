import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  let sql = `
    SELECT 
      c.name,
      c.symbol,
      c.sector,
      f.pe_ratio,
      f.roe,
      s.price,
      s.market_cap,
      a.recommendation,
      a.confidence
    FROM companies c
    JOIN financials f ON c.symbol = f.symbol
    JOIN stocks s ON c.symbol = s.symbol
    LEFT JOIN ai_insights a ON c.symbol = a.symbol
  `;

  // Simple condition parsing
  const q = query.toLowerCase();

if (q.includes("pe") && q.includes("10")) {
  sql += " WHERE f.pe_ratio < 10";
} else if (q.includes("bank")) {
  sql += " WHERE c.sector = 'Banking'";
} else if (q.includes("it")) {
  sql += " WHERE c.sector = 'IT'";
} else {
  sql += " LIMIT 10";
}


  const results = await db.all(sql);
  res.json(results);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
// testing git commit
