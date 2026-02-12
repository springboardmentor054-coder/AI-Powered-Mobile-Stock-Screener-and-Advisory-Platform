const { fetchOverview } = require("./marketData");
const delay = ms => new Promise(res => setTimeout(res, ms));

const FIELD_MAP = {
  pe: "PERatio",
  eps: "EPS",
  marketcap: "MarketCapitalization",
  profitmargin: "ProfitMargin",
  dividendyield: "DividendYield",
  revenue: "RevenueTTM"
};

function toNumber(value) {
  if (!value) return null;

  return Number(
    String(value)
      .replace(/,/g, "")
      .replace(/%/g, "")
      .replace(/[^\d.-]/g, "")
  );
}

function passesFilter(actual, filter) {
  if (actual === null) return false;

  switch (filter.op) {
    case "<":
      return actual < filter.value;
    case "<=":
      return actual <= filter.value;
    case ">":
      return actual > filter.value;
    case ">=":
      return actual >= filter.value;
    case "=":
      return actual === filter.value;
    case "!=":
      return actual !== filter.value;
    default:
      return false;
  }
}

function getSymbols() {
  const envSymbols = process.env.STOCK_SYMBOLS;

  if (!envSymbols) {
    // Default stocks (can expand later)
    return ["IBM", "AAPL", "MSFT", "NVDA", "TSLA"];
  }

  return envSymbols
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

async function runLiveFilter(dsl) {
  const symbols = getSymbols();
  const results = [];

  for (const symbol of symbols) {
  await delay(1200);
    try {
      const data = await fetchOverview(symbol);

      // Skip API limit / errors
      if (!data || data.Note || data.Information || data.ErrorMessage) {
        continue;
      }

      let allMatch = true;
      const snapshot = {};

      for (const filter of dsl.filters) {
        const apiField = FIELD_MAP[filter.field];

        if (!apiField || !data[apiField]) {
          allMatch = false;
          break;
        }

        const actual = toNumber(data[apiField]);
        snapshot[filter.field] = actual;

        if (!passesFilter(actual, filter)) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        results.push({
          symbol,
          company: data.Name || symbol,
          metrics: snapshot
        });
      }

    } catch (err) {
      console.log("Fetch error:", symbol, err.message);
    }
  }

  return results;
}

module.exports = { runLiveFilter };
