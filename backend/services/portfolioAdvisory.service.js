/**
 * Portfolio Advisory Service
 * Industry-grade portfolio management and advisory platform
 */

const pool = require("../database");
const realTimeAnalysis = require("./realTimeAnalysis.service");

class PortfolioAdvisoryService {
  /**
   * Analyze complete portfolio and provide recommendations
   * @param {Array} holdings - Array of {symbol, quantity, avg_price}
   * @returns {Promise<Object>} Portfolio analysis with recommendations
   */
  async analyzePortfolio(holdings) {
    try {
      const analyses = await Promise.all(
        holdings.map(holding => this.analyzeHolding(holding))
      );

      const portfolio = {
        total_value: 0,
        total_cost: 0,
        total_gain_loss: 0,
        total_gain_loss_percent: 0,
        holdings: analyses,
        diversification: this.analyzeDiversification(analyses),
        risk_profile: this.calculatePortfolioRisk(analyses),
        rebalancing_suggestions: this.generateRebalancingSuggestions(analyses),
        tax_optimization: this.analyzeTaxOptimization(analyses),
        performance_metrics: this.calculatePerformanceMetrics(analyses),
        alerts: this.generateAlerts(analyses)
      };

      // Calculate totals
      portfolio.total_value = analyses.reduce((sum, h) => sum + h.current_value, 0);
      portfolio.total_cost = analyses.reduce((sum, h) => sum + h.total_cost, 0);
      portfolio.total_gain_loss = portfolio.total_value - portfolio.total_cost;
      portfolio.total_gain_loss_percent = (portfolio.total_gain_loss / portfolio.total_cost) * 100;

      return portfolio;
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze individual holding
   */
  async analyzeHolding(holding) {
    const { symbol, quantity, avg_price } = holding;
    
    // Get real-time analysis
    const analysis = await realTimeAnalysis.analyzeStock(symbol);
    const current_price = analysis.price_targets.current_price;

    return {
      symbol,
      quantity,
      avg_price,
      current_price,
      total_cost: quantity * avg_price,
      current_value: quantity * current_price,
      gain_loss: (current_price - avg_price) * quantity,
      gain_loss_percent: ((current_price - avg_price) / avg_price) * 100,
      analysis,
      recommendation: this.getHoldingRecommendation(analysis, avg_price, current_price)
    };
  }

  /**
   * Diversification Analysis
   */
  analyzeDiversification(holdings) {
    const by_sector = {};
    const total_value = holdings.reduce((sum, h) => sum + h.current_value, 0);

    holdings.forEach(h => {
      const sector = h.analysis.fundamentals.sector || 'Unknown';
      if (!by_sector[sector]) {
        by_sector[sector] = { value: 0, percentage: 0, count: 0 };
      }
      by_sector[sector].value += h.current_value;
      by_sector[sector].count += 1;
    });

    Object.keys(by_sector).forEach(sector => {
      by_sector[sector].percentage = (by_sector[sector].value / total_value) * 100;
    });

    // Check concentration risk
    const max_sector_percent = Math.max(...Object.values(by_sector).map(s => s.percentage));
    const concentration_risk = max_sector_percent > 40 ? 'High' : max_sector_percent > 25 ? 'Medium' : 'Low';

    return {
      by_sector,
      number_of_sectors: Object.keys(by_sector).length,
      number_of_stocks: holdings.length,
      concentration_risk,
      diversification_score: this.calculateDiversificationScore(by_sector, holdings.length)
    };
  }

  /**
   * Portfolio Risk Calculation
   */
  calculatePortfolioRisk(holdings) {
    const total_value = holdings.reduce((sum, h) => sum + h.current_value, 0);
    
    let weighted_volatility = 0;
    let weighted_beta = 0;

    holdings.forEach(h => {
      const weight = h.current_value / total_value;
      const risk = h.analysis.risk_metrics;
      weighted_volatility += risk.volatility.value * weight;
      weighted_beta += risk.beta.value * weight;
    });

    const portfolio_var = holdings.reduce((sum, h) => {
      const weight = h.current_value / total_value;
      return sum + (h.analysis.risk_metrics.value_at_risk.var_95 * weight);
    }, 0);

    return {
      weighted_volatility,
      weighted_beta,
      portfolio_var_95: portfolio_var,
      risk_category: this.categorizePortfolioRisk(weighted_volatility, weighted_beta),
      risk_score: Math.min(100, weighted_volatility * 2),
      interpretation: this.interpretPortfolioRisk(weighted_volatility, weighted_beta)
    };
  }

  /**
   * Rebalancing Suggestions
   */
  generateRebalancingSuggestions(holdings) {
    const suggestions = [];
    const total_value = holdings.reduce((sum, h) => sum + h.current_value, 0);

    holdings.forEach(h => {
      const weight = (h.current_value / total_value) * 100;
      const analysis = h.analysis;

      // Overweight positions
      if (weight > 20) {
        suggestions.push({
          type: 'REDUCE',
          symbol: h.symbol,
          current_weight: weight,
          reason: 'Position too concentrated - consider reducing',
          suggested_action: `Sell ${Math.round((weight - 15) / 100 * total_value / h.current_price)} shares`
        });
      }

      // Poor performers
      if (h.gain_loss_percent < -15 && analysis.overall_score < 40) {
        suggestions.push({
          type: 'EXIT',
          symbol: h.symbol,
          current_loss: h.gain_loss_percent.toFixed(2) + '%',
          reason: 'Underperforming with weak fundamentals',
          suggested_action: 'Consider exiting position'
        });
      }

      // Strong performers - take profit
      if (h.gain_loss_percent > 50 && analysis.technical.rsi.value > 70) {
        suggestions.push({
          type: 'BOOK_PROFIT',
          symbol: h.symbol,
          current_gain: h.gain_loss_percent.toFixed(2) + '%',
          reason: 'Strong gains + overbought signal',
          suggested_action: `Book partial profit - sell 30-50% of position`
        });
      }
    });

    return suggestions;
  }

  /**
   * Tax Optimization Analysis
   */
  analyzeTaxOptimization(holdings) {
    const short_term_gains = [];
    const long_term_gains = [];
    const losses = [];

    holdings.forEach(h => {
      if (h.gain_loss > 0) {
        // Assuming all are short-term for simulation
        short_term_gains.push({
          symbol: h.symbol,
          gain: h.gain_loss,
          tax_impact: h.gain_loss * 0.15 // 15% short-term tax
        });
      } else {
        losses.push({
          symbol: h.symbol,
          loss: Math.abs(h.gain_loss),
          tax_benefit: Math.abs(h.gain_loss) * 0.15
        });
      }
    });

    const total_short_term_gain = short_term_gains.reduce((sum, g) => sum + g.gain, 0);
    const total_losses = losses.reduce((sum, l) => sum + l.loss, 0);
    const net_taxable = total_short_term_gain - total_losses;

    return {
      short_term_gains,
      long_term_gains,
      losses,
      total_short_term_gain,
      total_long_term_gain: 0,
      total_losses,
      net_taxable_gain: Math.max(0, net_taxable),
      estimated_tax: Math.max(0, net_taxable) * 0.15,
      harvest_opportunities: this.identifyTaxHarvestOpportunities(holdings)
    };
  }

  /**
   * Performance Metrics
   */
  calculatePerformanceMetrics(holdings) {
    const total_value = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const total_cost = holdings.reduce((sum, h) => sum + h.total_cost, 0);
    const total_return = ((total_value - total_cost) / total_cost) * 100;

    // Calculate individual stock returns
    const returns = holdings.map(h => h.gain_loss_percent);
    const positive_returns = returns.filter(r => r > 0).length;
    const win_rate = (positive_returns / holdings.length) * 100;

    return {
      total_return,
      absolute_return: total_value - total_cost,
      win_rate,
      number_of_winners: positive_returns,
      number_of_losers: holdings.length - positive_returns,
      best_performer: this.findBestPerformer(holdings),
      worst_performer: this.findWorstPerformer(holdings),
      average_return: returns.reduce((a, b) => a + b, 0) / returns.length
    };
  }

  /**
   * Generate Alerts
   */
  generateAlerts(holdings) {
    const alerts = [];

    holdings.forEach(h => {
      const analysis = h.analysis;

      // Stop loss alerts
      if (h.gain_loss_percent < -10) {
        alerts.push({
          type: 'STOP_LOSS',
          severity: h.gain_loss_percent < -20 ? 'HIGH' : 'MEDIUM',
          symbol: h.symbol,
          message: `${h.symbol} down ${h.gain_loss_percent.toFixed(1)}% - Consider stop loss`,
          current_price: h.current_price,
          suggested_stop_loss: h.avg_price * 0.90
        });
      }

      // Technical alerts
      if (analysis.technical.rsi.value > 75) {
        alerts.push({
          type: 'OVERBOUGHT',
          severity: 'MEDIUM',
          symbol: h.symbol,
          message: `${h.symbol} is overbought (RSI: ${analysis.technical.rsi.value.toFixed(1)})`,
          action: 'Consider booking partial profits'
        });
      }

      if (analysis.technical.rsi.value < 25) {
        alerts.push({
          type: 'OVERSOLD',
          severity: 'LOW',
          symbol: h.symbol,
          message: `${h.symbol} is oversold (RSI: ${analysis.technical.rsi.value.toFixed(1)})`,
          action: 'Potential buying opportunity'
        });
      }

      // Risk alerts
      if (analysis.risk_metrics.risk_category === 'High Risk') {
        alerts.push({
          type: 'HIGH_RISK',
          severity: 'HIGH',
          symbol: h.symbol,
          message: `${h.symbol} shows high risk metrics`,
          details: `Volatility: ${analysis.risk_metrics.volatility.value.toFixed(1)}%`
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Investment Recommendations
   */
  async generateInvestmentRecommendations(portfolio_analysis, investment_amount) {
    // Get top-rated stocks from database
    const result = await pool.query(`
      SELECT 
        c.symbol,
        c.name,
        c.sector,
        f.pe_ratio,
        f.market_cap
      FROM companies c
      LEFT JOIN fundamentals f ON c.symbol = f.symbol
      WHERE f.pe_ratio < 25
      ORDER BY f.market_cap DESC
      LIMIT 10
    `);

    const recommendations = [];

    for (const stock of result.rows) {
      const analysis = await realTimeAnalysis.analyzeStock(stock.symbol);
      
      if (analysis.overall_score > 60) {
        recommendations.push({
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          score: analysis.overall_score,
          recommendation: analysis.recommendation,
          suggested_allocation: this.calculateAllocation(
            analysis.overall_score,
            analysis.risk_metrics.risk_category
          ),
          rationale: this.generateRationale(analysis)
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Helper Functions
   */
  getHoldingRecommendation(analysis, avg_price, current_price) {
    const gain_percent = ((current_price - avg_price) / avg_price) * 100;
    
    if (gain_percent < -15 && analysis.overall_score < 40) {
      return { action: 'EXIT', reason: 'Cut losses - weak fundamentals' };
    }
    
    if (gain_percent > 30 && analysis.technical.rsi.value > 70) {
      return { action: 'BOOK_PROFIT', reason: 'Take profits - overbought' };
    }
    
    if (analysis.overall_score > 70) {
      return { action: 'HOLD/ADD', reason: 'Strong fundamentals - accumulate' };
    }
    
    return { action: 'HOLD', reason: 'Monitor closely' };
  }

  calculateDiversificationScore(sectors, stock_count) {
    const sector_count = Object.keys(sectors).length;
    const max_concentration = Math.max(...Object.values(sectors).map(s => s.percentage));
    
    let score = 50;
    if (sector_count >= 5) score += 20;
    if (stock_count >= 10) score += 15;
    if (max_concentration < 25) score += 15;
    
    return Math.min(100, score);
  }

  categorizePortfolioRisk(volatility, beta) {
    if (volatility > 25 || beta > 1.3) return 'Aggressive';
    if (volatility < 15 && beta < 0.9) return 'Conservative';
    return 'Moderate';
  }

  interpretPortfolioRisk(volatility, beta) {
    return {
      volatility: `Annual volatility of ${volatility.toFixed(1)}% indicates ${volatility > 25 ? 'high' : 'moderate'} price fluctuations`,
      beta: `Beta of ${beta.toFixed(2)} means portfolio ${beta > 1 ? 'amplifies' : 'dampens'} market movements`,
      overall: `This is a ${this.categorizePortfolioRisk(volatility, beta).toLowerCase()} risk portfolio`
    };
  }

  identifyTaxHarvestOpportunities(holdings) {
    return holdings
      .filter(h => h.gain_loss < 0 && h.gain_loss_percent < -10)
      .map(h => ({
        symbol: h.symbol,
        unrealized_loss: Math.abs(h.gain_loss),
        tax_benefit: Math.abs(h.gain_loss) * 0.15,
        suggestion: 'Sell to book loss and offset gains'
      }));
  }

  findBestPerformer(holdings) {
    return holdings.reduce((best, current) => 
      current.gain_loss_percent > best.gain_loss_percent ? current : best
    );
  }

  findWorstPerformer(holdings) {
    return holdings.reduce((worst, current) => 
      current.gain_loss_percent < worst.gain_loss_percent ? current : worst
    );
  }

  calculateAllocation(score, risk_category) {
    if (risk_category === 'High Risk') return '5-10%';
    if (risk_category === 'Low Risk' && score > 80) return '15-20%';
    return '10-15%';
  }

  generateRationale(analysis) {
    const reasons = [];
    if (analysis.fundamentals.fundamental_score > 70) {
      reasons.push('Strong fundamentals');
    }
    if (analysis.technical.trend === 'Strong Uptrend') {
      reasons.push('Positive technical trend');
    }
    if (analysis.sentiment.market_mood === 'Bullish') {
      reasons.push('Bullish market sentiment');
    }
    return reasons.join(', ');
  }
}

module.exports = new PortfolioAdvisoryService();
