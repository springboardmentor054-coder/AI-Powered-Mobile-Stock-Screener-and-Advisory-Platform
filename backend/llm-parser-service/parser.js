const express = require("express");
const router = express.Router();

const FIELD_ALIASES = {
  pe: ["pe", "p/e", "p e", "price earnings", "pe ratio", "p/e ratio"],
  eps: ["eps", "earnings per share"],
  marketcap: ["market cap", "marketcap", "market capitalization"],
  profitmargin: ["profit margin", "net margin"],
  dividendyield: ["dividend", "dividend yield"],
  revenue: ["revenue", "sales"]
};

const OPERATOR_ALIASES = [
  { op: "<=", patterns: ["less than or equal to", "at most", "max", "no more than", "<="] },
  { op: ">=", patterns: ["greater than or equal to", "at least", "min", "no less than", ">="] },
  { op: "!=", patterns: ["not equal to", "not", "!="] },
  { op: "<", patterns: ["less than", "below", "under", "<"] },
  { op: ">", patterns: ["greater than", "above", "over", ">"] },
  { op: "=", patterns: ["equal to", "equals", "is", "="] }
];

function normalizeInput(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\bcompanies with\b/g, "")
    .replace(/\bstocks with\b/g, "")
    .replace(/\bshow\b/g, "")
    .replace(/\bfind\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(token) {
  if (!token) return null;

  const normalized = token.replace(/,/g, "").trim();
  const match = normalized.match(/(-?\d*\.?\d+)\s*([mb%])?/i);
  if (!match) return null;

  let value = Number(match[1]);
  const suffix = (match[2] || "").toLowerCase();

  if (suffix === "m") value *= 1_000_000;
  if (suffix === "b") value *= 1_000_000_000;

  return Number.isFinite(value) ? value : null;
}

function detectField(segment) {
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some(alias => segment.includes(alias))) {
      return field;
    }
  }
  return null;
}

function detectOperator(segment) {
  for (const entry of OPERATOR_ALIASES) {
    if (entry.patterns.some(pattern => segment.includes(pattern))) {
      return entry.op;
    }
  }
  return null;
}

function parseFilters(query) {
  const text = normalizeInput(query);
  if (!text) {
    throw new Error("Query is required");
  }

  const segments = text
    .split(/\band\b|,/)
    .map(s => s.trim())
    .filter(Boolean);

  const filters = [];

  for (const segment of segments) {
    const field = detectField(segment);
    const op = detectOperator(segment);
    const valueMatch = segment.match(/-?\d[\d,.]*(?:\.\d+)?\s*[mb%]?/i);
    const value = parseNumber(valueMatch ? valueMatch[0] : null);

    if (!field || !op || value === null) {
      continue;
    }

    filters.push({ field, op, value });
  }

  if (!filters.length) {
    throw new Error(
      "Could not parse query. Supported fields: pe, eps, market cap, profit margin, dividend yield, revenue"
    );
  }

  return {
    exchange: "US",
    filters,
    limit: 50
  };
}

router.post("/", (req, res) => {
  try {
    const { query } = req.body || {};
    const dsl = parseFilters(query);
    res.json({ dsl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
