/**
 * Advisory & Portfolio Analysis Routes
 * Industry-grade investment advisory endpoints
 */

const express = require('express');
const router = express.Router();
const realTimeAnalysis = require('../services/realTimeAnalysis.service');
const portfolioAdvisory = require('../services/portfolioAdvisory.service');

/**
 * @route   POST /api/advisory/analyze-stock
 * @desc    Get comprehensive stock analysis with recommendations
 * @access  Public
 */
router.post('/analyze-stock', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }
    
    // Validate symbol format
    if (typeof symbol !== 'string' || symbol.length > 20 || !/^[A-Za-z0-9]+$/.test(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol format' });
    }

    console.log(`[Advisory] Analyzing stock: ${symbol}`);
    const analysis = await realTimeAnalysis.analyzeStock(symbol.toUpperCase());

    res.json({
      success: true,
      data: analysis,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Stock analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze stock',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/advisory/analyze-portfolio
 * @desc    Analyze complete portfolio with recommendations
 * @access  Public
 * @body    { holdings: [{symbol, quantity, avg_price}] }
 */
router.post('/analyze-portfolio', async (req, res) => {
  try {
    const { holdings } = req.body;
    
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ 
        error: 'Holdings array is required',
        example: [{ symbol: 'AAPL', quantity: 10, avg_price: 150.00 }]
      });
    }

    console.log(`[Advisory] Analyzing portfolio with ${holdings.length} holdings`);
    const portfolio = await portfolioAdvisory.analyzePortfolio(holdings);

    res.json({
      success: true,
      data: portfolio,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Portfolio analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/advisory/investment-recommendations
 * @desc    Get personalized investment recommendations
 * @access  Public
 * @body    { portfolio_analysis (optional), investment_amount }
 */
router.post('/investment-recommendations', async (req, res) => {
  try {
    const { portfolio_analysis, investment_amount = 10000 } = req.body;

    console.log(`[Advisory] Generating recommendations for investment: $${investment_amount}`);
    const recommendations = await portfolioAdvisory.generateInvestmentRecommendations(
      portfolio_analysis,
      investment_amount
    );

    res.json({
      success: true,
      data: {
        investment_amount,
        recommendations,
        diversification_note: 'Spread investments across recommended stocks for better risk management'
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/advisory/risk-assessment
 * @desc    Get detailed risk assessment for a stock or portfolio
 * @access  Public
 */
router.post('/risk-assessment', async (req, res) => {
  try {
    const { symbol, holdings } = req.body;

    let risk_analysis;

    if (symbol) {
      // Single stock risk assessment
      const analysis = await realTimeAnalysis.analyzeStock(symbol.toUpperCase());
      risk_analysis = {
        type: 'single_stock',
        symbol,
        risk_metrics: analysis.risk_metrics,
        volatility_interpretation: analysis.risk_metrics.volatility.interpretation,
        beta_interpretation: analysis.risk_metrics.beta.interpretation,
        recommendations: [
          {
            risk_level: analysis.risk_metrics.risk_category,
            suggested_position_size: analysis.risk_metrics.risk_category === 'High Risk' ? '5-10%' : '10-20%',
            stop_loss: analysis.price_targets.stop_loss,
            diversification: 'Do not exceed 15% of portfolio in single stock'
          }
        ]
      };
    } else if (holdings && Array.isArray(holdings)) {
      // Portfolio risk assessment
      const portfolio = await portfolioAdvisory.analyzePortfolio(holdings);
      risk_analysis = {
        type: 'portfolio',
        risk_profile: portfolio.risk_profile,
        diversification: portfolio.diversification,
        concentration_risks: portfolio.diversification.concentration_risk,
        recommendations: this.generateRiskRecommendations(portfolio)
      };
    } else {
      return res.status(400).json({ 
        error: 'Either symbol or holdings array required' 
      });
    }

    res.json({
      success: true,
      data: risk_analysis,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Risk assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess risk',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/advisory/market-insights
 * @desc    Get real-time market insights and trends
 * @access  Public
 */
router.get('/market-insights', async (req, res) => {
  try {
    // Simulated market insights - In production, integrate with real market data
    const insights = {
      market_summary: {
        indices: {
          sp500: { value: 4500, change: '+0.5%', trend: 'Bullish' },
          nasdaq: { value: 14000, change: '+0.7%', trend: 'Bullish' },
          dow: { value: 35000, change: '+0.3%', trend: 'Neutral' }
        },
        market_sentiment: 'Moderately Bullish',
        vix: { value: 15.5, interpretation: 'Low volatility - Calm market' },
        fear_greed_index: { value: 65, interpretation: 'Greed - Investors are optimistic' }
      },
      sector_performance: {
        top_performers: [
          { sector: 'Technology', performance: '+2.3%' },
          { sector: 'Healthcare', performance: '+1.8%' },
          { sector: 'Consumer Discretionary', performance: '+1.5%' }
        ],
        worst_performers: [
          { sector: 'Energy', performance: '-1.2%' },
          { sector: 'Utilities', performance: '-0.8%' }
        ]
      },
      key_events: [
        { event: 'Fed Meeting', date: '2024-01-31', impact: 'High' },
        { event: 'Q4 Earnings Season', status: 'Ongoing', impact: 'High' }
      ],
      trading_signals: {
        overall_signal: 'BUY',
        confidence: 'Medium',
        reasons: ['Positive market momentum', 'Strong tech sector', 'Low volatility']
      }
    };

    res.json({
      success: true,
      data: insights,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Market insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market insights',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/advisory/compare-stocks
 * @desc    Compare multiple stocks side-by-side
 * @access  Public
 */
router.post('/compare-stocks', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 stock symbols required for comparison',
        example: { symbols: ['AAPL', 'GOOGL', 'MSFT'] }
      });
    }

    console.log(`[Advisory] Comparing stocks: ${symbols.join(', ')}`);
    
    const comparisons = await Promise.all(
      symbols.map(symbol => realTimeAnalysis.analyzeStock(symbol.toUpperCase()))
    );

    const comparison_table = {
      stocks: comparisons.map(c => ({
        symbol: c.symbol,
        overall_score: c.overall_score,
        recommendation: c.recommendation.action,
        fundamental_score: c.fundamentals.fundamental_score,
        technical_score: c.technical.technical_score,
        risk_category: c.risk_metrics.risk_category,
        pe_ratio: c.fundamentals.pe_ratio,
        revenue_growth: c.fundamentals.revenue_growth,
        current_price: c.price_targets.current_price
      })),
      best_value: this.findBestByMetric(comparisons, 'pe_ratio', 'lowest'),
      best_growth: this.findBestByMetric(comparisons, 'revenue_growth', 'highest'),
      best_overall: this.findBestByMetric(comparisons, 'overall_score', 'highest'),
      lowest_risk: this.findLowestRisk(comparisons)
    };

    res.json({
      success: true,
      data: comparison_table,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Advisory] Stock comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare stocks',
      message: error.message
    });
  }
});

/**
 * Helper Functions
 */
function generateRiskRecommendations(portfolio) {
  const recommendations = [];
  
  if (portfolio.diversification.concentration_risk === 'High') {
    recommendations.push({
      priority: 'HIGH',
      action: 'Reduce concentration',
      details: 'One or more sectors are over-weighted. Consider rebalancing.'
    });
  }
  
  if (portfolio.risk_profile.risk_category === 'Aggressive') {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Lower portfolio volatility',
      details: 'Add defensive stocks or bonds to reduce overall risk'
    });
  }
  
  return recommendations;
}

function findBestByMetric(comparisons, metric, direction) {
  if (direction === 'highest') {
    return comparisons.reduce((best, current) => {
      const currentValue = current.fundamentals[metric] || current[metric] || 0;
      const bestValue = best.fundamentals[metric] || best[metric] || 0;
      return currentValue > bestValue ? current : best;
    }).symbol;
  } else {
    return comparisons.reduce((best, current) => {
      const currentValue = current.fundamentals[metric] || current[metric] || Infinity;
      const bestValue = best.fundamentals[metric] || best[metric] || Infinity;
      return currentValue < bestValue ? current : best;
    }).symbol;
  }
}

function findLowestRisk(comparisons) {
  return comparisons.reduce((lowest, current) => {
    const riskOrder = { 'Low Risk': 1, 'Moderate Risk': 2, 'High Risk': 3 };
    const currentRisk = riskOrder[current.risk_metrics.risk_category] || 2;
    const lowestRisk = riskOrder[lowest.risk_metrics.risk_category] || 2;
    return currentRisk < lowestRisk ? current : lowest;
  }).symbol;
}

module.exports = router;
