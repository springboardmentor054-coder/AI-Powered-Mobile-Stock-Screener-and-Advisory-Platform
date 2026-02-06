/**
 * Advanced Quarterly Filtering Service
 * Support for complex quarterly financial filters including:
 * - Positive earnings for last N quarters
 * - Revenue growth for last N quarters
 * - EBITDA growth
 * - Multi-quarter comparisons
 */

const pool = require("../database");

class QuarterlyFilterService {
  /**
   * Filter stocks with positive earnings for last N quarters
   * @param {number} nQuarters - Number of quarters to check
   * @param {number} minProfit - Minimum profit threshold (optional)
   * @returns {Promise<Array>} Stocks matching criteria
   */
  async findStocksWithPositiveEarnings(nQuarters = 4, minProfit = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          c.id,
          c.symbol,
          c.name,
          c.sector,
          COUNT(qf.id) as quarters_count,
          AVG(qf.profit) as avg_profit,
          MIN(qf.profit) as min_profit,
          MAX(qf.profit) as max_profit
         FROM companies c
         INNER JOIN (
           SELECT company_id, id, quarter, profit,
                  ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
           FROM quarterly_financials
         ) qf ON c.symbol = qf.company_id
         WHERE qf.rn <= $1 AND qf.profit > $2
         GROUP BY c.id, c.symbol, c.name, c.sector
         HAVING COUNT(qf.id) = $1
         ORDER BY avg_profit DESC`,
        [nQuarters, minProfit]
      );

      return result.rows;
    } catch (error) {
      console.error("Find stocks with positive earnings error:", error);
      throw error;
    }
  }

  /**
   * Filter stocks with revenue growth for last N quarters
   * @param {number} nQuarters - Number of quarters to analyze
   * @param {number} minGrowthRate - Minimum quarter-over-quarter growth (%)
   * @returns {Promise<Array>} Stocks with consistent revenue growth
   */
  async findStocksWithRevenueGrowth(nQuarters = 4, minGrowthRate = 0) {
    try {
      const result = await pool.query(
        `WITH quarterly_data AS (
          SELECT 
            company_id,
            quarter,
            revenue,
            LAG(revenue) OVER (PARTITION BY company_id ORDER BY quarter) as prev_revenue,
            ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
          FROM quarterly_financials
        ),
        growth_calc AS (
          SELECT 
            company_id,
            quarter,
            revenue,
            CASE 
              WHEN prev_revenue > 0 
              THEN ((revenue - prev_revenue) / prev_revenue * 100)
              ELSE NULL 
            END as growth_rate
          FROM quarterly_data
          WHERE rn <= $1
        )
        SELECT 
          c.id,
          c.symbol,
          c.name,
          c.sector,
          COUNT(g.quarter) as quarters_analyzed,
          AVG(g.growth_rate) as avg_growth_rate,
          MIN(g.growth_rate) as min_growth_rate,
          MAX(g.growth_rate) as max_growth_rate,
          BOOL_AND(g.growth_rate >= $2) as all_positive_growth
        FROM companies c
        INNER JOIN growth_calc g ON c.symbol = g.company_id
        WHERE g.growth_rate IS NOT NULL
        GROUP BY c.id, c.symbol, c.name, c.sector
        HAVING BOOL_AND(g.growth_rate >= $2)
        ORDER BY avg_growth_rate DESC`,
        [nQuarters, minGrowthRate]
      );

      return result.rows;
    } catch (error) {
      console.error("Find stocks with revenue growth error:", error);
      throw error;
    }
  }

  /**
   * Advanced filter: Stocks with improving profit margins
   * @param {number} nQuarters - Quarters to analyze
   * @returns {Promise<Array>} Stocks with improving margins
   */
  async findStocksWithImprovingMargins(nQuarters = 4) {
    try {
      const result = await pool.query(
        `WITH margin_data AS (
          SELECT 
            company_id,
            quarter,
            (profit::DECIMAL / NULLIF(revenue, 0) * 100) as profit_margin,
            ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
          FROM quarterly_financials
          WHERE revenue > 0
        ),
        margin_trend AS (
          SELECT 
            company_id,
            AVG(CASE WHEN rn <= 2 THEN profit_margin END) as recent_margin,
            AVG(CASE WHEN rn > 2 AND rn <= $1 THEN profit_margin END) as older_margin
          FROM margin_data
          WHERE rn <= $1
          GROUP BY company_id
          HAVING COUNT(*) >= $1
        )
        SELECT 
          c.id,
          c.symbol,
          c.name,
          c.sector,
          ROUND(mt.older_margin::NUMERIC, 2) as older_avg_margin,
          ROUND(mt.recent_margin::NUMERIC, 2) as recent_avg_margin,
          ROUND((mt.recent_margin - mt.older_margin)::NUMERIC, 2) as margin_improvement
        FROM companies c
        INNER JOIN margin_trend mt ON c.symbol = mt.company_id
        WHERE mt.recent_margin > mt.older_margin
        ORDER BY margin_improvement DESC`,
        [nQuarters]
      );

      return result.rows;
    } catch (error) {
      console.error("Find stocks with improving margins error:", error);
      throw error;
    }
  }

  /**
   * Find stocks with consistent quarterly performance
   * @param {number} nQuarters - Quarters to check
   * @param {number} maxVolatility - Maximum coefficient of variation (%)
   * @returns {Promise<Array>} Stocks with stable performance
   */
  async findStocksWithConsistentPerformance(nQuarters = 4, maxVolatility = 20) {
    try {
      const result = await pool.query(
        `WITH quarterly_stats AS (
          SELECT 
            company_id,
            COUNT(*) as quarters_count,
            AVG(profit) as avg_profit,
            STDDEV(profit) as stddev_profit
          FROM (
            SELECT 
              company_id,
              profit,
              ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
            FROM quarterly_financials
          ) sub
          WHERE rn <= $1 AND profit > 0
          GROUP BY company_id
          HAVING COUNT(*) = $1
        )
        SELECT 
          c.id,
          c.symbol,
          c.name,
          c.sector,
          ROUND(qs.avg_profit::NUMERIC, 0) as avg_profit,
          ROUND(qs.stddev_profit::NUMERIC, 0) as stddev_profit,
          ROUND((qs.stddev_profit / NULLIF(qs.avg_profit, 0) * 100)::NUMERIC, 2) as coefficient_of_variation
        FROM companies c
        INNER JOIN quarterly_stats qs ON c.symbol = qs.company_id
        WHERE (qs.stddev_profit / NULLIF(qs.avg_profit, 0) * 100) <= $2
        ORDER BY coefficient_of_variation ASC`,
        [nQuarters, maxVolatility]
      );

      return result.rows;
    } catch (error) {
      console.error("Find stocks with consistent performance error:", error);
      throw error;
    }
  }

  /**
   * Advanced: Stocks exceeding sector average growth
   * @param {string} sector - Sector to compare within
   * @param {number} nQuarters - Quarters to analyze
   * @returns {Promise<Array>} Above-average performers
   */
  async findSectorOutperformers(sector, nQuarters = 4) {
    try {
      const result = await pool.query(
        `WITH sector_growth AS (
          SELECT 
            qf.company_id,
            AVG(
              CASE 
                WHEN prev.revenue > 0 
                THEN ((qf.revenue - prev.revenue) / prev.revenue * 100)
                ELSE 0
              END
            ) as avg_growth
          FROM (
            SELECT 
              company_id,
              quarter,
              revenue,
              ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
            FROM quarterly_financials
          ) qf
          LEFT JOIN (
            SELECT 
              company_id,
              quarter,
              revenue,
              ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY quarter DESC) as rn
            FROM quarterly_financials
          ) prev ON qf.company_id = prev.company_id AND qf.rn = prev.rn - 1
          WHERE qf.rn <= $2
          GROUP BY qf.company_id
        ),
        sector_avg AS (
          SELECT 
            AVG(sg.avg_growth) as sector_average
          FROM companies c
          INNER JOIN sector_growth sg ON c.symbol = sg.company_id
          WHERE c.sector = $1
        )
        SELECT 
          c.id,
          c.symbol,
          c.name,
          c.sector,
          ROUND(sg.avg_growth::NUMERIC, 2) as company_growth,
          ROUND(sa.sector_average::NUMERIC, 2) as sector_average,
          ROUND((sg.avg_growth - sa.sector_average)::NUMERIC, 2) as outperformance
        FROM companies c
        INNER JOIN sector_growth sg ON c.symbol = sg.company_id
        CROSS JOIN sector_avg sa
        WHERE c.sector = $1 AND sg.avg_growth > sa.sector_average
        ORDER BY outperformance DESC`,
        [sector, nQuarters]
      );

      return result.rows;
    } catch (error) {
      console.error("Find sector outperformers error:", error);
      throw error;
    }
  }

  /**
   * Get detailed quarterly trend for a stock
   * @param {string} symbol - Stock symbol
   * @param {number} nQuarters - Number of quarters
   * @returns {Promise<Object>} Quarterly analysis
   */
  async getQuarterlyTrend(symbol, nQuarters = 8) {
    try {
      const result = await pool.query(
        `SELECT 
          quarter,
          revenue,
          profit,
          (profit::DECIMAL / NULLIF(revenue, 0) * 100) as profit_margin,
          LAG(revenue) OVER (ORDER BY quarter) as prev_revenue,
          LAG(profit) OVER (ORDER BY quarter) as prev_profit
         FROM quarterly_financials
         WHERE company_id = $1
         ORDER BY quarter DESC
         LIMIT $2`,
        [symbol, nQuarters]
      );

      const quarters = result.rows.reverse().map((q, idx) => {
        const revenueGrowth = q.prev_revenue && q.prev_revenue > 0
          ? ((parseFloat(q.revenue) - parseFloat(q.prev_revenue)) / parseFloat(q.prev_revenue) * 100).toFixed(2)
          : null;
          
        const profitGrowth = q.prev_profit && q.prev_profit > 0
          ? ((parseFloat(q.profit) - parseFloat(q.prev_profit)) / parseFloat(q.prev_profit) * 100).toFixed(2)
          : null;

        return {
          quarter: q.quarter,
          revenue: parseFloat(q.revenue),
          profit: parseFloat(q.profit),
          profit_margin: parseFloat(q.profit_margin).toFixed(2),
          revenue_growth_qoq: revenueGrowth,
          profit_growth_qoq: profitGrowth
        };
      });

      // Calculate averages
      const avgRevenue = quarters.reduce((sum, q) => sum + q.revenue, 0) / quarters.length;
      const avgProfit = quarters.reduce((sum, q) => sum + q.profit, 0) / quarters.length;
      const avgMargin = quarters.reduce((sum, q) => sum + parseFloat(q.profit_margin), 0) / quarters.length;

      return {
        symbol,
        quarters_analyzed: quarters.length,
        quarters: quarters,
        averages: {
          revenue: avgRevenue.toFixed(0),
          profit: avgProfit.toFixed(0),
          profit_margin: avgMargin.toFixed(2)
        },
        trend_analysis: this.analyzeTrend(quarters)
      };
    } catch (error) {
      console.error("Get quarterly trend error:", error);
      throw error;
    }
  }

  /**
   * Helper: Analyze trend from quarterly data
   */
  analyzeTrend(quarters) {
    if (quarters.length < 3) {
      return { available: false, message: 'Insufficient data' };
    }

    const recentQuarters = quarters.slice(-3);
    const revenueIncreasing = recentQuarters.every((q, i) => 
      i === 0 || q.revenue >= recentQuarters[i - 1].revenue
    );
    
    const profitIncreasing = recentQuarters.every((q, i) => 
      i === 0 || q.profit >= recentQuarters[i - 1].profit
    );

    const allProfitable = quarters.every(q => q.profit > 0);

    return {
      revenue_trend: revenueIncreasing ? 'Increasing' : 'Mixed/Declining',
      profit_trend: profitIncreasing ? 'Increasing' : 'Mixed/Declining',
      profitability: allProfitable ? 'All quarters profitable' : 'Some losses observed',
      strength: (revenueIncreasing && profitIncreasing && allProfitable) ? 'Strong' : 'Moderate'
    };
  }
}

module.exports = new QuarterlyFilterService();
