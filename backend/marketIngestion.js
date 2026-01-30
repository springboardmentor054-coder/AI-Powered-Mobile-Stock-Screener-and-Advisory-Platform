const axios = require("axios");
const pool = require("./db");

const API_KEY = "DYWVD2LYOKZ9R0G5";

/* --------- Get Company Overview --------- */
async function fetchOverview(symbol) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

/* --------- Get Live Price --------- */
async function fetchPrice(symbol) {

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

  const res = await axios.get(url);

  if (
    res.data &&
    res.data["Global Quote"] &&
    res.data["Global Quote"]["05. price"]
  ) {
    return parseFloat(res.data["Global Quote"]["05. price"]);
  } else {
    console.log("Price not available for", symbol);
    return 0;
  }
}


/* --------- Save to DB --------- */
async function saveStock(overview, price) {

  if (!overview || !overview.Symbol || overview.Information) {
    console.log("Skipping invalid data");
    return;
  }


  const sql = `
    INSERT INTO stocks(
      symbol,
      company_name,
      sector,
      current_price,
      peg_ratio,
      promoter_holding,
      buyback,
      next_earnings_date
    )
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT(symbol)
    DO UPDATE SET
      current_price = EXCLUDED.current_price,
      peg_ratio = EXCLUDED.peg_ratio;
  `;

  await pool.query(sql, [
    overview.Symbol,
    overview.Name,
    "IT",
    price || 0,
    overview.PEGRatio || 0,
    60,
    true,
    "2026-02-05"
  ]);
}

/* --------- Main Runner --------- */
async function ingest() {

  const symbols = ["INFY", "TCS", "HCLTECH", "WIPRO"];

  for (let s of symbols) {

  const overview = await fetchOverview(s);
  await new Promise(r => setTimeout(r, 1200));   // wait 1.2 sec

  const price = await fetchPrice(s);
  await new Promise(r => setTimeout(r, 1200));   // wait again

  await saveStock(overview, price);

  console.log("Saved", s);
}

}

module.exports = ingest;
