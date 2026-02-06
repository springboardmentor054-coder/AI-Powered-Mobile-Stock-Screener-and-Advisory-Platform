/**
 * Portfolio Management Service
 * Production-grade portfolio CRUD operations with validation and REAL-TIME PRICING
 */

const pool = require("../database");
const auditService = require("./audit.service");
const marketDataService = require("./realTimeMarketData.service");

class PortfolioService {
  /**
   * Add stock to user's portfolio
   * @param {number} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} quantity - Number of shares
   * @param {number} avgPrice - Average purchase price
   * @returns {Promise<Object>} Portfolio item
   */
  async addStock(userId, symbol, quantity, avgPrice) {
    // Input validation
    if (!userId || !symbol || !quantity || !avgPrice) {
      throw new Error("Missing required fields: userId, symbol, quantity, avgPrice");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (avgPrice <= 0) {
      throw new Error("Average price must be greater than 0");
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error("User not found");
      }

      // Get or verify company exists
      const symbolUpper = symbol.toUpperCase();
      let companyResult = await client.query(
        'SELECT id, symbol, name FROM companies WHERE symbol = $1',
        [symbolUpper]
      );

      let companyId;
      if (companyResult.rows.length === 0) {
        // Create placeholder company (should ideally fetch from external API)
        const insertCompany = await client.query(
          'INSERT INTO companies (symbol, name) VALUES ($1, $2) RETURNING id',
          [symbolUpper, symbolUpper]
        );
        companyId = insertCompany.rows[0].id;
      } else {
        companyId = companyResult.rows[0].id;
      }

      // Check for existing position
      const existing = await client.query(
        'SELECT id, quantity, avg_price FROM portfolio_items WHERE user_id = $1 AND company_id = $2',
        [userId, companyId]
      );

      let result;
      if (existing.rows.length > 0) {
        // Update existing position (calculate new average price)
        const oldQty = parseFloat(existing.rows[0].quantity);
        const oldAvg = parseFloat(existing.rows[0].avg_price);
        const newQty = oldQty + quantity;
        const newAvg = ((oldQty * oldAvg) + (quantity * avgPrice)) / newQty;

        result = await client.query(
          `UPDATE portfolio_items 
           SET quantity = $1, avg_price = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3 
           RETURNING *`,
          [newQty, newAvg, existing.rows[0].id]
        );

        // Audit log
        await auditService.log({
          userId,
          entityType: 'portfolio',
          entityId: result.rows[0].id,
          action: 'update',
          description: `Updated position: ${symbolUpper} - Added ${quantity} shares`,
          metadata: { 
            symbol: symbolUpper, 
            old_quantity: oldQty, 
            new_quantity: newQty,
            old_avg_price: oldAvg,
            new_avg_price: newAvg
          }
        }, client);
      } else {
        // Insert new position
        result = await client.query(
          `INSERT INTO portfolio_items (user_id, company_id, quantity, avg_price) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [userId, companyId, quantity, avgPrice]
        );

        // Audit log
        await auditService.log({
          userId,
          entityType: 'portfolio',
          entityId: result.rows[0].id,
          action: 'create',
          description: `Added new position: ${symbolUpper}`,
          metadata: { symbol: symbolUpper, quantity, avg_price: avgPrice }
        }, client);
      }

      await client.query('COMMIT');

      // Return with company info
      const portfolioItem = result.rows[0];
      return {
        ...portfolioItem,
        symbol: symbolUpper,
        company_id: companyId
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Portfolio add error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove stock from user's portfolio
   * @param {number} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Deletion result
   */
  async removeStock(userId, symbol) {
    if (!userId || !symbol) {
      throw new Error("Missing required fields: userId, symbol");
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const symbolUpper = symbol.toUpperCase();

      // Get company ID
      const companyResult = await client.query(
        'SELECT id FROM companies WHERE symbol = $1',
        [symbolUpper]
      );

      if (companyResult.rows.length === 0) {
        throw new Error("Stock not found");
      }

      const companyId = companyResult.rows[0].id;

      // Delete portfolio item
      const result = await client.query(
        `DELETE FROM portfolio_items 
         WHERE user_id = $1 AND company_id = $2 
         RETURNING *`,
        [userId, companyId]
      );

      if (result.rows.length === 0) {
        throw new Error("Portfolio item not found");
      }

      // Audit log
      await auditService.log({
        userId,
        entityType: 'portfolio',
        entityId: result.rows[0].id,
        action: 'delete',
        description: `Removed position: ${symbolUpper}`,
        metadata: { 
          symbol: symbolUpper, 
          quantity: result.rows[0].quantity,
          avg_price: result.rows[0].avg_price
        }
      }, client);

      await client.query('COMMIT');

      return {
        success: true,
        message: `Removed ${symbolUpper} from portfolio`,
        deleted: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Portfolio remove error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * List all stocks in user's portfolio with REAL-TIME PRICES and P&L
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Portfolio with holdings, summary, and calculations
   */
  async listPortfolio(userId) {
    if (!userId) {
      throw new Error("Missing required field: userId");
    }

    try {
      const result = await pool.query(
        `SELECT 
          pi.id,
          pi.user_id,
          pi.quantity,
          pi.avg_price,
          pi.added_at,
          pi.updated_at,
          c.id as company_id,
          c.symbol,
          c.name,
          c.sector,
          c.exchange,
          f.pe_ratio,
          f.market_cap,
          f.eps,
          f.revenue_growth
         FROM portfolio_items pi
         INNER JOIN companies c ON pi.company_id = c.id
         LEFT JOIN fundamentals f ON c.symbol = f.symbol
         WHERE pi.user_id = $1
         ORDER BY pi.updated_at DESC`,
        [userId]
      );

      const holdings = result.rows;
      
      if (holdings.length === 0) {
        return {
          holdings: [],
          summary: {
            total_investment: 0,
            current_value: 0,
            total_gain_loss: 0,
            total_gain_loss_percent: 0
          }
        };
      }

      // Fetch real-time prices for all holdings
      const symbols = holdings.map(h => h.symbol);
      const priceData = await marketDataService.getBulkRealtimeData(symbols);
      const priceMap = new Map(priceData.map(p => [p.symbol, p]));
      
      console.log(`[Portfolio] Fetched prices for ${priceData.length}/${symbols.length} stocks`);

      // Calculate P&L for each holding
      let totalInvestment = 0;
      let totalCurrentValue = 0;

      const enrichedHoldings = holdings.map(holding => {
        const quantity = parseFloat(holding.quantity);
        const avgPrice = parseFloat(holding.avg_price);
        const prices = priceMap.get(holding.symbol);
        const currentPrice = prices?.currentPrice || avgPrice; // Fallback to avgPrice if no real-time data

        const investment = quantity * avgPrice;
        const currentValue = quantity * currentPrice;
        const gainLoss = currentValue - investment;
        const gainLossPercent = ((gainLoss / investment) * 100).toFixed(2);

        totalInvestment += investment;
        totalCurrentValue += currentValue;

        return {
          ...holding,
          quantity: parseFloat(holding.quantity),
          avg_price: parseFloat(holding.avg_price),
          current_price: currentPrice,
          investment: parseFloat(investment.toFixed(2)),
          current_value: parseFloat(currentValue.toFixed(2)),
          gain_loss: parseFloat(gainLoss.toFixed(2)),
          gain_loss_percent: parseFloat(gainLossPercent),
          last_price_update: prices?.lastUpdate,
          price_source: prices?.isMock ? 'MOCK' : 'YAHOO_FINANCE'
        };
      });

      const totalGainLoss = totalCurrentValue - totalInvestment;
      const totalGainLossPercent = ((totalGainLoss / totalInvestment) * 100).toFixed(2);

      return {
        holdings: enrichedHoldings,
        summary: {
          total_investment: parseFloat(totalInvestment.toFixed(2)),
          current_value: parseFloat(totalCurrentValue.toFixed(2)),
          total_gain_loss: parseFloat(totalGainLoss.toFixed(2)),
          total_gain_loss_percent: parseFloat(totalGainLossPercent),
          total_holdings: enrichedHoldings.length
        }
      };
    } catch (error) {
      console.error("Portfolio list error:", error);
      throw error;
    }
  }

  /**
   * Update portfolio item quantity/price
   * @param {number} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} quantity - New quantity
   * @param {number} avgPrice - New average price
   * @returns {Promise<Object>} Updated portfolio item
   */
  async updateStock(userId, symbol, quantity, avgPrice) {
    if (!userId || !symbol || quantity === undefined || avgPrice === undefined) {
      throw new Error("Missing required fields");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (avgPrice <= 0) {
      throw new Error("Average price must be greater than 0");
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const symbolUpper = symbol.toUpperCase();

      // Get company ID
      const companyResult = await client.query(
        'SELECT id FROM companies WHERE symbol = $1',
        [symbolUpper]
      );

      if (companyResult.rows.length === 0) {
        throw new Error("Stock not found");
      }

      const companyId = companyResult.rows[0].id;

      // Update portfolio item
      const result = await client.query(
        `UPDATE portfolio_items 
         SET quantity = $1, avg_price = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $3 AND company_id = $4 
         RETURNING *`,
        [quantity, avgPrice, userId, companyId]
      );

      if (result.rows.length === 0) {
        throw new Error("Portfolio item not found");
      }

      // Audit log
      await auditService.log({
        userId,
        entityType: 'portfolio',
        entityId: result.rows[0].id,
        action: 'update',
        description: `Updated position: ${symbolUpper}`,
        metadata: { 
          symbol: symbolUpper, 
          quantity, 
          avg_price: avgPrice 
        }
      }, client);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Portfolio update error:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PortfolioService();
