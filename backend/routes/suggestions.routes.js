/**
 * Query Suggestions Routes
 * Provides autocomplete and suggestions for screener queries
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const cache = require('../cache');

// Common query patterns and templates
const QUERY_TEMPLATES = [
  // PE Ratio queries
  { pattern: 'pe below', template: 'show stocks with pe_ratio < {value}', description: 'Stocks with PE below a value' },
  { pattern: 'pe above', template: 'show stocks with pe_ratio > {value}', description: 'Stocks with PE above a value' },
  { pattern: 'low pe', template: 'show stocks with pe_ratio < 15', description: 'Low PE ratio stocks' },
  { pattern: 'high pe', template: 'show stocks with pe_ratio > 30', description: 'High PE ratio stocks' },
  
  // Sector queries
  { pattern: 'it stocks', template: 'show stocks where sector = IT', description: 'Information Technology stocks' },
  { pattern: 'finance stocks', template: 'show stocks where sector = Finance', description: 'Finance sector stocks' },
  { pattern: 'banking stocks', template: 'show stocks where sector = Finance', description: 'Banking stocks' },
  { pattern: 'tech stocks', template: 'show stocks where sector = IT', description: 'Technology stocks' },
  
  // Growth queries
  { pattern: 'high growth', template: 'show stocks with revenue_growth > 15', description: 'High growth stocks' },
  { pattern: 'revenue growth', template: 'show stocks with revenue_growth > {value}', description: 'Stocks with revenue growth' },
  
  // Debt queries
  { pattern: 'low debt', template: 'show stocks with debt_to_fcf < 0.3', description: 'Low debt stocks' },
  { pattern: 'debt free', template: 'show stocks with debt_to_fcf < 0.1', description: 'Nearly debt-free stocks' },
  
  // Market cap queries
  { pattern: 'large cap', template: 'show stocks with market_cap > 100000000000', description: 'Large cap stocks' },
  { pattern: 'mid cap', template: 'show stocks with market_cap between 10000000000 and 100000000000', description: 'Mid cap stocks' },
  { pattern: 'small cap', template: 'show stocks with market_cap < 10000000000', description: 'Small cap stocks' },
  
  // Value stocks
  { pattern: 'value stocks', template: 'show stocks with pe_ratio < 20 and peg_ratio < 1.5', description: 'Value stocks' },
  { pattern: 'undervalued', template: 'show stocks with pe_ratio < 15 and debt_to_fcf < 0.3', description: 'Undervalued stocks' },
  
  // Combined queries
  { pattern: 'it low pe', template: 'show stocks where sector = IT and pe_ratio < 25', description: 'IT stocks with low PE' },
  { pattern: 'finance low debt', template: 'show stocks where sector = Finance and debt_to_fcf < 0.3', description: 'Finance stocks with low debt' },
];

/**
 * @route   GET /api/suggestions
 * @desc    Get query suggestions based on input
 * @query   q - Search query
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          popular: QUERY_TEMPLATES.slice(0, 5).map(t => ({
            query: t.template.replace('{value}', '20'),
            description: t.description
          }))
        }
      });
    }

    const searchQuery = q.toLowerCase().trim();
    
    // Match against templates
    const matches = QUERY_TEMPLATES
      .filter(template => 
        template.pattern.includes(searchQuery) || 
        template.description.toLowerCase().includes(searchQuery)
      )
      .map(template => ({
        query: template.template.replace('{value}', '20'), // Default value
        description: template.description,
        pattern: template.pattern
      }))
      .slice(0, 10);

    // Get sectors for autocomplete
    const sectors = await getAvailableSectors(searchQuery);
    
    // Get stock symbols for autocomplete
    const symbols = await getMatchingSymbols(searchQuery);

    res.json({
      success: true,
      data: {
        suggestions: matches,
        sectors: sectors,
        symbols: symbols
      }
    });
  } catch (error) {
    console.error('[Suggestions] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/suggestions/sectors
 * @desc    Get all available sectors
 * @access  Public
 */
router.get('/sectors', async (req, res) => {
  try {
    const cacheKey = 'all_sectors';
    let sectors = cache.get(cacheKey);

    if (!sectors) {
      const result = await db.query(
        'SELECT DISTINCT sector FROM companies WHERE sector IS NOT NULL ORDER BY sector'
      );
      sectors = result.rows.map(row => row.sector);
      cache.set(cacheKey, sectors, 3600); // Cache for 1 hour
    }

    res.json({
      success: true,
      data: { sectors }
    });
  } catch (error) {
    console.error('[Suggestions] Sectors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sectors'
    });
  }
});

/**
 * @route   GET /api/suggestions/symbols
 * @desc    Get all stock symbols with names
 * @query   search - Optional search filter
 * @access  Public
 */
router.get('/symbols', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT symbol, name, sector FROM companies';
    let params = [];

    if (search && search.trim()) {
      query += ' WHERE symbol ILIKE $1 OR name ILIKE $1';
      params.push(`%${search.trim()}%`);
    }

    query += ' ORDER BY symbol LIMIT 50';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        symbols: result.rows
      }
    });
  } catch (error) {
    console.error('[Suggestions] Symbols error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symbols'
    });
  }
});

/**
 * Helper: Get available sectors matching search
 */
async function getAvailableSectors(search) {
  try {
    const result = await db.query(
      `SELECT DISTINCT sector 
       FROM companies 
       WHERE sector IS NOT NULL 
       AND LOWER(sector) LIKE $1
       ORDER BY sector
       LIMIT 5`,
      [`%${search}%`]
    );
    return result.rows.map(row => row.sector);
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return [];
  }
}

/**
 * Helper: Get matching stock symbols
 */
async function getMatchingSymbols(search) {
  try {
    const result = await db.query(
      `SELECT symbol, name 
       FROM companies 
       WHERE LOWER(symbol) LIKE $1 OR LOWER(name) LIKE $1
       ORDER BY symbol
       LIMIT 5`,
      [`%${search}%`]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return [];
  }
}

module.exports = router;
