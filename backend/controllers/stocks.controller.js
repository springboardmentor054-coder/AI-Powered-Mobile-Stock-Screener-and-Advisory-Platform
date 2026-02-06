const pool = require("../database");
// REMOVED: Alpha Vantage service (deprecated)
// const { fetchCompanyOverview } = require("../services/marketData.service");
const marketDataService = require("../services/realTimeMarketData.service");

// DEPRECATED: Fetch and store stock data from Alpha Vantage API
// This function is no longer used - Yahoo Finance via realTimeMarketData.service is primary
/*
async function fetchAndStoreStock(req, res) {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }
    
    // Validate ticker format (basic validation)
    if (typeof ticker !== 'string' || ticker.length > 20 || !/^[A-Za-z0-9]+$/.test(ticker)) {
      return res.status(400).json({ error: "Invalid ticker format" });
    }

    const data = await fetchCompanyOverview(ticker);

    const symbolResult = await pool.query(
      `
      INSERT INTO symbols (ticker, exchange, company_name, sector, industry)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (ticker)
      DO UPDATE SET ticker = EXCLUDED.ticker
      RETURNING id
      `,
      [ticker, "NSE", data.Name, data.Sector, data.Industry]
    );

    const symbolId = symbolResult.rows[0].id;

    await pool.query(
      `
      INSERT INTO fundamentals
      (symbol_id, pe_ratio, market_cap, eps, debt_to_equity, promoter_holding)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol_id)
      DO UPDATE SET 
        pe_ratio = EXCLUDED.pe_ratio,
        market_cap = EXCLUDED.market_cap,
        eps = EXCLUDED.eps,
        debt_to_equity = EXCLUDED.debt_to_equity,
        promoter_holding = EXCLUDED.promoter_holding
      `,
      [
        symbolId,
        data.PERatio,
        data.MarketCapitalization,
        data.EPS,
        data.DebtToEquity,
        data.PromoterHolding || 0
      ]
    );

    res.json({ message: "Market data fetched and stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
*/

// This API reads stock data from database and enriches with REAL price data from Yahoo Finance
async function getStocks(req, res) {
  try {
    console.log('[Stocks] Fetching stocks with real-time prices...');
    
    // Step 1: Get fundamental data from database
    const result = await pool.query(`
      SELECT
        c.symbol,
        c.name,
        c.sector,
        f.pe_ratio,
        f.market_cap,
        f.eps,
        f.debt_to_fcf as debt_to_equity,
        f.revenue_growth as roe,
        f.peg_ratio,
        f.updated_at
      FROM companies c
      LEFT JOIN fundamentals f ON f.symbol = c.symbol
      ORDER BY c.symbol;
    `);

    const stocks = result.rows;
    console.log(`[Stocks] Found ${stocks.length} stocks in database`);

    // Step 2: Get real-time prices from Yahoo Finance for all stocks
    const symbols = stocks.map(s => s.symbol);
    const priceData = await marketDataService.getBulkRealtimeData(symbols);
    
    // Create a map for quick lookup
    const priceMap = new Map(priceData.map(p => [p.symbol, p]));
    
    console.log(`[Stocks] Fetched real-time prices for ${priceData.length}/${symbols.length} stocks`);

    // Step 3: Merge fundamental data with real-time prices
    const enrichedStocks = stocks.map(stock => {
      const prices = priceMap.get(stock.symbol);
      
      // Convert PostgreSQL numeric strings to numbers
      const numericStock = {
        ...stock,
        pe_ratio: parseFloat(stock.pe_ratio) || null,
        market_cap: parseFloat(stock.market_cap) || null,
        eps: parseFloat(stock.eps) || null,
        debt_to_equity: parseFloat(stock.debt_to_equity) || null,
        roe: parseFloat(stock.roe) || null,
        peg_ratio: parseFloat(stock.peg_ratio) || null
      };
      
      if (prices && !prices.isMock) {
        // Real price data available
        return {
          ...numericStock,
          current_price: prices.currentPrice,
          previous_close: prices.previousClose,
          change_percent: prices.changePercent,
          volume: prices.volume,
          high: prices.high,
          low: prices.low,
          open: prices.open,
          last_update: prices.lastUpdate,
          data_source: 'YAHOO_FINANCE',
          is_real_data: true
        };
      } else {
        // Fallback: Use database market_cap and PE for estimation (with clear flag)
        const estimatedPrice = numericStock.market_cap && numericStock.pe_ratio 
          ? (numericStock.market_cap / 1000000000.0 * numericStock.pe_ratio / 10.0) 
          : 0;
        
        return {
          ...numericStock,
          current_price: estimatedPrice,
          previous_close: estimatedPrice * 0.99,
          change_percent: 1.0,
          volume: 0,
          data_source: 'ESTIMATED_FROM_FUNDAMENTALS',
          is_real_data: false,
          warning: 'Estimated price - real-time data unavailable'
        };
      }
    });

    console.log(`[Stocks] Returning ${enrichedStocks.length} stocks with prices`);

    res.json({
      success: true,
      data: enrichedStocks,
      count: enrichedStocks.length,
      realDataCount: enrichedStocks.filter(s => s.is_real_data).length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Stocks] Error fetching stocks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stocks from database',
      message: error.message
    });
  }
}

module.exports = { getStocks };
