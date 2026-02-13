const express = require("express");
const router = express.Router();
const pool = require("../database");
const { parseQuery } = require("../llm");
const { compileDSL } = require("../compileDSL");
const { validateDSL } = require("../services/validationService");
const queryCache = require("../services/queryCache.service");
const responseFormatter = require("../utils/responseFormatter");
const logger = require("../utils/logger");

const SUPPORTED_SCREENER_FIELDS = [
  "pe_ratio",
  "market_cap_cr",
  "industry_pe",
  "pb_ratio",
  "roe",
  "roce",
  "eps",
  "ltp",
  "change_pct",
  "open",
  "volume",
  "return_1m",
  "return_3m",
  "return_1y",
  "return_3y",
  "return_5y",
  "rsi",
  "dividend",
  "high_52w",
  "low_52w",
  "dma_50",
  "dma_200",
  "margin_funding",
  "margin_pledge"
];

/**
 * POST /screener
 * Natural language stock screening endpoint with caching and REAL price data
 * 
 * Body: { "query": "Show IT stocks with PE below 5" }
 * Returns: Array of matching stocks with real-time prices
 */
router.post("/screener", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json(
        responseFormatter.error(
          'Query parameter is required and must be a string',
          'INVALID_REQUEST'
        )
      );
    }
    
    logger.info(logger.LOG_CATEGORIES.API, 'Processing screener query', { query });
    
    // Parse natural language to DSL
    const rawDsl = await parseQuery(query);
    const { dsl, diagnostics } = normalizeDsl(rawDsl);
    validateDSL(dsl);

    const hasFilterIntent =
      hasNumericConstraintIntent(query) ||
      (Array.isArray(rawDsl?.filters) && rawDsl.filters.length > 0);

    if (dsl.filters.length === 0 && hasFilterIntent) {
      return res.status(422).json(
        responseFormatter.error(
          "No supported screener filters were detected in your query.",
          "UNSUPPORTED_FILTERS",
          {
            supported_fields: SUPPORTED_SCREENER_FIELDS,
            ignored_filters: diagnostics.ignoredFilters
          }
        )
      );
    }

    const bypassCache =
      req.query.fresh === "true" ||
      /\b(latest|live|real[\s-]?time|today|now)\b/i.test(query);
    
    // Check cache
    if (!bypassCache) {
      const cachedResult = await queryCache.get(dsl);
      if (cachedResult) {
        logger.info(logger.LOG_CATEGORIES.CACHE, 'Cache hit for screener query');
        return res.json(
          responseFormatter.success(cachedResult, {
            cached: true,
            cache_bypassed: false,
            execution_time_ms: Date.now() - startTime,
            count: cachedResult.length,
            applied_filters: dsl.filters,
            ignored_filters: diagnostics.ignoredFilters
          })
        );
      }
    }
    
    // Execute query to get Dhan CSV data
    const sql = compileDSL(dsl);
    const result = await pool.query(sql.sql, sql.params);
    
    logger.info(logger.LOG_CATEGORIES.API, 'Screener query executed', {
      stocks_found: result.rows.length,
      source: 'DHAN_CSV'
    });

    // Dhan CSV data already has complete pricing - no need for external enrichment
    // Map to consistent response format
    const enrichedResults = result.rows.map(stock => ({
      ...stock,
      current_price: stock.ltp || 0,
      status: 'loaded_from_csv',
      data_source: 'DHAN_CSV'
    }));

    // Cache Dhan results with short TTL so query output remains responsive.
    await queryCache.set(dsl, enrichedResults, 120);

    res.json(
      responseFormatter.success(enrichedResults, {
        cached: false,
        cache_bypassed: bypassCache,
        execution_time_ms: Date.now() - startTime,
        count: enrichedResults.length,
        source: 'DHAN_CSV',
        applied_filters: dsl.filters,
        ignored_filters: diagnostics.ignoredFilters
      })
    );
  } catch (err) {
    logger.error(logger.LOG_CATEGORIES.API, 'Screener error', { error: err.message });
    res.status(400).json(
      responseFormatter.error(err.message, 'SCREENER_ERROR', {
        execution_time_ms: Date.now() - startTime
      })
    );
  }
});

/**
 * GET /screener/cache/stats
 * Get cache performance statistics
 */
router.get("/cache/stats", (req, res) => {
  res.json(
    responseFormatter.success(queryCache.getStats())
  );
});

/**
 * DELETE /screener/cache
 * Clear query cache
 */
router.delete("/cache", async (req, res) => {
  try {
    await queryCache.clearAll();
    res.json(
      responseFormatter.success(null, {}, 'Cache cleared successfully')
    );
  } catch (err) {
    res.status(500).json(
      responseFormatter.error(err.message, 'CACHE_CLEAR_ERROR')
    );
  }
});

module.exports = router;

function normalizeDsl(dsl) {
  if (!dsl || typeof dsl !== "object") {
    return {
      dsl: { filters: [] },
      diagnostics: { ignoredFilters: [] }
    };
  }

  const normalized = { ...dsl };
  const allowedFields = new Set(SUPPORTED_SCREENER_FIELDS);
  const allowedOperators = new Set(["<", ">", "<=", ">=", "="]);
  const fieldAliases = {
    market_cap: "market_cap_cr",
    market_capitalization: "market_cap_cr",
    industry_p_e: "industry_pe",
    sector_pe: "industry_pe",
    current_price: "ltp",
    price: "ltp",
    change_percent: "change_pct",
    change_percentage: "change_pct",
    opening_price: "open",
    open_price: "open",
    high52w: "high_52w",
    low52w: "low_52w",
    moving_average_50: "dma_50",
    moving_average_200: "dma_200",
    sma_50: "dma_50",
    sma_200: "dma_200",
    funding_margin: "margin_funding",
    pledge_margin: "margin_pledge"
  };
  const operatorAliases = {
    "==": "=",
    "eq": "=",
    "equals": "=",
    "equal": "=",
    "below": "<",
    "under": "<",
    "less_than": "<",
    "less than": "<",
    "above": ">",
    "over": ">",
    "greater_than": ">",
    "greater than": ">"
  };

  if (!Array.isArray(normalized.filters)) {
    normalized.filters = [];
  }

  const ignoredFilters = [];
  const appliedFilters = [];

  for (const filter of normalized.filters) {
    if (!filter || !filter.field || !filter.operator || filter.value === undefined) {
      ignoredFilters.push({ reason: "missing_required_fields", filter });
      continue;
    }

    const rawField = String(filter.field).trim().toLowerCase();
    const rawOperator = String(filter.operator).trim().toLowerCase();
    const canonicalField = fieldAliases[rawField] || rawField;
    const canonicalOperator = operatorAliases[rawOperator] || filter.operator;

    let value = filter.value;
    if (typeof value === "string") {
      const trimmed = value.trim().replace(/,/g, "").replace(/%/g, "");
      if (trimmed.length > 0 && !Number.isNaN(Number(trimmed))) {
        value = Number(trimmed);
      }
    }

    if (!allowedFields.has(canonicalField)) {
      ignoredFilters.push({
        reason: "unsupported_field",
        filter,
        canonical_field: canonicalField
      });
      continue;
    }

    if (!allowedOperators.has(canonicalOperator)) {
      ignoredFilters.push({
        reason: "unsupported_operator",
        filter,
        canonical_operator: canonicalOperator
      });
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      ignoredFilters.push({ reason: "invalid_value", filter });
      continue;
    }

    appliedFilters.push({
      field: canonicalField,
      operator: canonicalOperator,
      value
    });
  }

  normalized.filters = appliedFilters;

  return {
    dsl: normalized,
    diagnostics: { ignoredFilters }
  };
}

function hasNumericConstraintIntent(query) {
  const text = String(query || "");
  return /(\babove\b|\bbelow\b|\bunder\b|\bover\b|\bless than\b|\bgreater than\b|\bat least\b|\bat most\b|>=|<=|=|>|<)\s*\d/i.test(
    text
  );
}
