/**
 * Insights Engine Service
 * SEBI-Compliant informational insights for stocks
 * Provides analysis WITHOUT investment recommendations
 */

const pool = require("../database");

class InsightsService {
  /**
   * Generate comprehensive insights for a stock
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Insights object
   */
  async generateInsights(symbol) {
    try {
      const [fundamentals, quarterly, valuation, growth, momentum] = await Promise.all([
        this.getFundamentals(symbol),
        this.getQuarterlyPerformance(symbol),
        this.analyzeValuation(symbol),
        this.analyzeGrowth(symbol),
        this.analyzeMomentum(symbol)
      ]);

      return {
        symbol,
        timestamp: new Date().toISOString(),
        fundamentals_overview: fundamentals,
        quarterly_performance: quarterly,
        valuation_insights: valuation,
        growth_insights: growth,
        momentum_insights: momentum,
        key_highlights: this.generateKeyHighlights(fundamentals, quarterly, valuation, growth),
        risk_factors: this.identifyRiskFactors(fundamentals, quarterly),
        disclaimer: "This is informational analysis only. Not investment advice. Please consult a SEBI-registered advisor before making investment decisions."
      };
    } catch (error) {
      console.error("Generate insights error:", error);
      throw error;
    }
  }

  /**
   * Get fundamental metrics
   */
  async getFundamentals(symbol) {
    try {
      const result = await pool.query(
        `SELECT c.symbol, c.name, c.sector, c.exchange,
                f.pe_ratio, f.peg_ratio, f.debt_to_fcf, 
                f.revenue_growth, f.market_cap, f.eps
         FROM companies c
         INNER JOIN fundamentals f ON c.symbol = f.symbol
         WHERE c.symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0) {
        throw new Error(`Stock ${symbol} not found`);
      }

      const data = result.rows[0];
      
      return {
        company_name: data.name,
        sector: data.sector,
        exchange: data.exchange,
        market_cap: data.market_cap,
        market_cap_category: this.categorizeMarketCap(data.market_cap),
        pe_ratio: data.pe_ratio,
        peg_ratio: data.peg_ratio,
        eps: data.eps,
        debt_to_fcf: data.debt_to_fcf,
        revenue_growth: data.revenue_growth
      };
    } catch (error) {
      console.error("Get fundamentals error:", error);
      throw error;
    }
  }

  /**
   * Get quarterly performance trends
   */
  async getQuarterlyPerformance(symbol) {
    try {
      const result = await pool.query(
        `SELECT quarter, revenue, profit
         FROM quarterly_financials
         WHERE company_id = $1
         ORDER BY quarter DESC
         LIMIT 8`,
        [symbol]
      );

      if (result.rows.length === 0) {
        return {
          data_available: false,
          message: "Quarterly data not available"
        };
      }

      const quarters = result.rows.reverse();
      
      // Calculate trends
      const revenueGrowth = this.calculateGrowthRate(
        quarters.map(q => parseFloat(q.revenue))
      );
      
      const profitGrowth = this.calculateGrowthRate(
        quarters.map(q => parseFloat(q.profit))
      );

      const profitMargin = quarters.map(q => ({
        quarter: q.quarter,
        margin: (parseFloat(q.profit) / parseFloat(q.revenue) * 100).toFixed(2)
      }));

      return {
        data_available: true,
        quarters_analyzed: quarters.length,
        revenue_trend: revenueGrowth.trend,
        revenue_growth_rate: revenueGrowth.rate,
        profit_trend: profitGrowth.trend,
        profit_growth_rate: profitGrowth.rate,
        profit_margins: profitMargin,
        consistency: this.assessConsistency(quarters)
      };
    } catch (error) {
      console.error("Get quarterly performance error:", error);
      throw error;
    }
  }

  /**
   * Analyze valuation metrics
   */
  async analyzeValuation(symbol) {
    try {
      const result = await pool.query(
        `SELECT pe_ratio, peg_ratio, market_cap, eps
         FROM fundamentals
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0) {
        return { available: false };
      }

      const { pe_ratio, peg_ratio, market_cap, eps } = result.rows[0];

      return {
        available: true,
        pe_analysis: this.analyzePE(pe_ratio),
        peg_analysis: this.analyzePEG(peg_ratio),
        valuation_level: this.determineValuationLevel(pe_ratio, peg_ratio),
        insights: this.generateValuationInsights(pe_ratio, peg_ratio)
      };
    } catch (error) {
      console.error("Analyze valuation error:", error);
      throw error;
    }
  }

  /**
   * Analyze growth metrics
   */
  async analyzeGrowth(symbol) {
    try {
      const result = await pool.query(
        `SELECT revenue_growth
         FROM fundamentals
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0) {
        return { available: false };
      }

      const revenueGrowth = parseFloat(result.rows[0].revenue_growth);

      return {
        available: true,
        revenue_growth_rate: revenueGrowth,
        growth_category: this.categorizeGrowth(revenueGrowth),
        growth_quality: this.assessGrowthQuality(revenueGrowth),
        insights: this.generateGrowthInsights(revenueGrowth)
      };
    } catch (error) {
      console.error("Analyze growth error:", error);
      throw error;
    }
  }

  /**
   * Analyze price momentum (placeholder for future real-time data)
   */
  async analyzeMomentum(symbol) {
    return {
      available: false,
      message: "Real-time price data integration pending",
      note: "This will include moving averages, RSI, and trend analysis when connected to market data feed"
    };
  }

  /**
   * Generate key highlights
   */
  generateKeyHighlights(fundamentals, quarterly, valuation, growth) {
    const highlights = [];

    // Market cap highlight
    if (fundamentals.market_cap_category === 'Large Cap') {
      highlights.push({
        type: 'STABILITY',
        title: 'Large Cap Company',
        description: `${fundamentals.company_name} is a large-cap company, generally considered more stable.`
      });
    }

    // Valuation highlight
    if (valuation.available && valuation.valuation_level) {
      highlights.push({
        type: 'VALUATION',
        title: `${valuation.valuation_level} Valuation`,
        description: valuation.insights[0] || 'Valuation metrics analyzed'
      });
    }

    // Growth highlight
    if (growth.available && growth.revenue_growth_rate > 15) {
      highlights.push({
        type: 'GROWTH',
        title: 'Strong Revenue Growth',
        description: `Revenue growing at ${growth.revenue_growth_rate.toFixed(1)}% annually`
      });
    }

    // Quarterly consistency
    if (quarterly.data_available && quarterly.consistency === 'High') {
      highlights.push({
        type: 'CONSISTENCY',
        title: 'Consistent Performance',
        description: 'Demonstrates consistent quarterly results'
      });
    }

    return highlights;
  }

  /**
   * Identify risk factors
   */
  identifyRiskFactors(fundamentals, quarterly) {
    const risks = [];

    // High debt risk
    if (fundamentals.debt_to_fcf > 0.5) {
      risks.push({
        type: 'DEBT',
        severity: fundamentals.debt_to_fcf > 0.7 ? 'HIGH' : 'MEDIUM',
        title: 'Elevated Debt Levels',
        description: `Debt-to-FCF ratio of ${fundamentals.debt_to_fcf.toFixed(2)} indicates significant leverage`
      });
    }

    // Declining revenue trend
    if (quarterly.data_available && quarterly.revenue_trend === 'Declining') {
      risks.push({
        type: 'REVENUE',
        severity: 'HIGH',
        title: 'Declining Revenue Trend',
        description: 'Revenue shows declining trend in recent quarters'
      });
    }

    // High PE ratio
    if (fundamentals.pe_ratio > 40) {
      risks.push({
        type: 'VALUATION',
        severity: 'MEDIUM',
        title: 'High Valuation Multiples',
        description: `PE ratio of ${fundamentals.pe_ratio.toFixed(1)} suggests premium valuation - vulnerable to market corrections`
      });
    }

    return risks;
  }

  // Helper methods

  categorizeMarketCap(marketCap) {
    if (marketCap >= 200000000000) return 'Large Cap'; // >= 200 Cr
    if (marketCap >= 50000000000) return 'Mid Cap';    // >= 50 Cr
    return 'Small Cap';
  }

  calculateGrowthRate(values) {
    if (values.length < 2) return { trend: 'Insufficient data', rate: 0 };
    
    const first = values[0];
    const last = values[values.length - 1];
    const rate = ((last - first) / first * 100);
    
    return {
      trend: rate > 0 ? 'Growing' : 'Declining',
      rate: rate.toFixed(2)
    };
  }

  assessConsistency(quarters) {
    if (quarters.length < 4) return 'Insufficient data';
    
    const profits = quarters.map(q => parseFloat(q.profit));
    const allPositive = profits.every(p => p > 0);
    const allGrowing = profits.every((p, i) => i === 0 || p >= profits[i - 1]);
    
    if (allPositive && allGrowing) return 'High';
    if (allPositive) return 'Medium';
    return 'Low';
  }

  analyzePE(peRatio) {
    if (!peRatio) return 'Not available';
    if (peRatio < 15) return 'Low (potentially undervalued or slow growth)';
    if (peRatio < 25) return 'Moderate (market average)';
    if (peRatio < 35) return 'High (growth premium priced in)';
    return 'Very High (expensive valuation)';
  }

  analyzePEG(pegRatio) {
    if (!pegRatio) return 'Not available';
    if (pegRatio < 1) return 'Attractive (growth not fully valued)';
    if (pegRatio < 2) return 'Fair (reasonable growth valuation)';
    return 'Expensive (high price for growth)';
  }

  determineValuationLevel(peRatio, pegRatio) {
    if (!peRatio) return 'Data unavailable';
    if (peRatio < 20 && pegRatio < 1.5) return 'Attractive Valuation';
    if (peRatio < 30) return 'Fair Valuation';
    return 'Premium Valuation';
  }

  generateValuationInsights(peRatio, pegRatio) {
    const insights = [];
    
    if (peRatio && peRatio < 15) {
      insights.push('Stock trades at below-market PE ratio');
    }
    
    if (pegRatio && pegRatio < 1) {
      insights.push('PEG ratio suggests growth potential not fully priced in');
    }
    
    if (peRatio && peRatio > 35) {
      insights.push('High PE ratio indicates market expects strong future growth');
    }
    
    return insights;
  }

  categorizeGrowth(revenueGrowth) {
    if (revenueGrowth > 25) return 'High Growth';
    if (revenueGrowth > 15) return 'Moderate Growth';
    if (revenueGrowth > 5) return 'Stable Growth';
    return 'Low/Negative Growth';
  }

  assessGrowthQuality(revenueGrowth) {
    if (revenueGrowth > 20) return 'Strong';
    if (revenueGrowth > 10) return 'Good';
    if (revenueGrowth > 0) return 'Modest';
    return 'Weak';
  }

  generateGrowthInsights(revenueGrowth) {
    const insights = [];
    
    if (revenueGrowth > 20) {
      insights.push('Company demonstrating strong top-line expansion');
    } else if (revenueGrowth > 10) {
      insights.push('Healthy revenue growth maintained');
    } else if (revenueGrowth > 0) {
      insights.push('Modest revenue growth - monitor future performance');
    } else {
      insights.push('Revenue challenges observed - requires deeper analysis');
    }
    
    return insights;
  }
}

module.exports = new InsightsService();
