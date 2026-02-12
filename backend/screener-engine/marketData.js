const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.ALPHAVANTAGE_API_KEY;
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function fromCache(symbol) {
  const key = symbol.toUpperCase();
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

async function fetchOverview(symbol) {
  const sym = String(symbol || "").toUpperCase();
  if (!sym) return null;

  const cached = fromCache(sym);
  if (cached) return cached;

  if (!API_KEY) {
    throw new Error("Missing ALPHA_VANTAGE_API_KEY");
  }

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${sym}&apikey=${API_KEY}`;
  const res = await axios.get(url, { timeout: 12000 });

  cache.set(sym, { ts: Date.now(), data: res.data });
  return res.data;
}

module.exports = { fetchOverview };
