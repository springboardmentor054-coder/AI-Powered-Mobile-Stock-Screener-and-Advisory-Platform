const express = require("express");
const { parseQueryToDSL } = require("../services/llmParser");
const { compileDSLToSQL } = require("../services/screenerCompiler");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Protected route - requires authentication
router.post("/run", authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;

    // Validate input
    if (!query) {
      return res.status(400).json({ 
        success: false,
        message: "Query is required",
        error: "MISSING_QUERY"
      });
    }

    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Query must be a non-empty string",
        error: "INVALID_QUERY_FORMAT"
      });
    }

    // Parse query to DSL
    const parseResult = await parseQueryToDSL(query);
    
    // Check if parsing failed
    if (parseResult.error) {
      return res.status(400).json({ 
        success: false,
        message: parseResult.message,
        error: "PARSING_FAILED",
        details: parseResult.details || parseResult.validationErrors,
        userQuery: query
      });
    }

    // Compile DSL to SQL
    const sqlResult = compileDSLToSQL(parseResult.dsl);
    
    // Check if SQL compilation failed
    if (sqlResult.error) {
      return res.status(500).json({ 
        success: false,
        message: sqlResult.message,
        error: "SQL_COMPILATION_FAILED",
        details: sqlResult.details,
        userQuery: query,
        parsedDSL: parseResult.dsl
      });
    }

    // Execute SQL query
    console.log('Executing SQL:', sqlResult.sql);
    const result = await pool.query(sqlResult.sql);
    const stocks = result.rows;

    // Success response with format expected by frontend
    res.json({
      success: true,
      data: stocks,
      dsl: JSON.stringify(parseResult.dsl),
      sql: sqlResult.sql,
      count: stocks.length,
      userQuery: query,
      usedLLM: parseResult.usedLLM || false
    });

  } catch (error) {
    console.error('Screener error:', error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error while processing query",
      error: "INTERNAL_ERROR",
      details: error.message
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "operational",
    service: "screener",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
