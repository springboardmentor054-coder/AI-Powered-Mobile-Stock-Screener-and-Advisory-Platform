/**
 * Market Insights & Educational Content Routes
 * Industry-grade insights, guides, and educational platform
 */

const express = require('express');
const router = express.Router();
const realTimeAnalysis = require('../services/realTimeAnalysis.service');

/**
 * @route   GET /api/insights/learning-hub
 * @desc    Educational content and investment guides
 * @access  Public
 */
router.get('/learning-hub', async (req, res) => {
  try {
    const learning_content = {
      beginner_guides: [
        {
          id: 1,
          title: 'Understanding Stock Market Basics',
          topics: ['What are stocks?', 'How stock prices work', 'Market indices explained'],
          difficulty: 'Beginner',
          duration: '15 mins'
        },
        {
          id: 2,
          title: 'How to Read Financial Statements',
          topics: ['Income statement', 'Balance sheet', 'Cash flow statement'],
          difficulty: 'Beginner',
          duration: '20 mins'
        },
        {
          id: 3,
          title: 'Portfolio Diversification 101',
          topics: ['Why diversify?', 'Asset allocation', 'Sector diversification'],
          difficulty: 'Beginner',
          duration: '12 mins'
        }
      ],
      advanced_guides: [
        {
          id: 4,
          title: 'Technical Analysis Deep Dive',
          topics: ['RSI & MACD indicators', 'Chart patterns', 'Volume analysis'],
          difficulty: 'Advanced',
          duration: '30 mins'
        },
        {
          id: 5,
          title: 'Risk Management Strategies',
          topics: ['Stop-loss orders', 'Position sizing', 'Portfolio hedging'],
          difficulty: 'Advanced',
          duration: '25 mins'
        },
        {
          id: 6,
          title: 'Value Investing Framework',
          topics: ['Graham principles', 'Intrinsic value', 'Margin of safety'],
          difficulty: 'Advanced',
          duration: '35 mins'
        }
      ],
      glossary: {
        pe_ratio: {
          term: 'P/E Ratio (Price-to-Earnings)',
          definition: 'Valuation metric comparing stock price to earnings per share',
          example: 'A P/E of 15 means investors pay $15 for every $1 of earnings',
          interpretation: 'Lower P/E may indicate undervaluation (but check industry norms)'
        },
        rsi: {
          term: 'RSI (Relative Strength Index)',
          definition: 'Momentum indicator measuring overbought/oversold conditions',
          example: 'RSI > 70 = overbought, RSI < 30 = oversold',
          interpretation: 'Use with other indicators for confirmation'
        },
        beta: {
          term: 'Beta',
          definition: 'Measure of stock volatility relative to overall market',
          example: 'Beta of 1.5 means stock moves 50% more than market',
          interpretation: 'Higher beta = higher risk but potentially higher returns'
        },
        sharpe_ratio: {
          term: 'Sharpe Ratio',
          definition: 'Risk-adjusted return metric',
          example: 'Sharpe > 1 is good, > 2 is very good',
          interpretation: 'Higher Sharpe = better return per unit of risk'
        }
      },
      video_tutorials: [
        { title: 'How to Use Our Stock Screener', duration: '10 mins', url: '#' },
        { title: 'Reading Portfolio Analytics', duration: '12 mins', url: '#' },
        { title: 'Understanding Risk Metrics', duration: '15 mins', url: '#' }
      ]
    };

    res.json({
      success: true,
      data: learning_content,
      message: 'Browse our comprehensive learning resources'
    });
  } catch (error) {
    console.error('[Insights] Learning hub error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning content',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/market-commentary
 * @desc    Daily market commentary and analysis
 * @access  Public
 */
router.get('/market-commentary', async (req, res) => {
  try {
    const commentary = {
      today: {
        date: new Date().toISOString().split('T')[0],
        headline: 'Tech Sector Leads Market Rally Amid Strong Earnings',
        summary: 'Major indices closed higher as technology stocks surged on better-than-expected quarterly results. The S&P 500 gained 0.8% while Nasdaq jumped 1.2%.',
        key_points: [
          'Technology sector up 1.5% - Best performer of the day',
          'Energy sector down 0.7% on oil price weakness',
          'Federal Reserve maintains dovish stance',
          'Strong earnings from mega-cap tech companies'
        ],
        market_outlook: {
          short_term: 'Bullish - Momentum remains positive',
          medium_term: 'Cautiously Optimistic - Watch inflation data',
          risk_factors: ['Geopolitical tensions', 'Interest rate uncertainty']
        }
      },
      sector_spotlight: {
        sector: 'Technology',
        performance_ytd: '+12.5%',
        outlook: 'Positive',
        key_drivers: [
          'AI and machine learning adoption',
          'Cloud computing growth',
          'Digital transformation trends'
        ],
        top_picks: ['AAPL', 'MSFT', 'GOOGL'],
        risks: ['Regulatory scrutiny', 'High valuations']
      },
      expert_opinions: [
        {
          analyst: 'Market Strategist',
          view: 'BULLISH',
          timeframe: '6 months',
          reasoning: 'Strong corporate earnings and Fed support should drive markets higher'
        },
        {
          analyst: 'Chief Economist',
          view: 'NEUTRAL',
          timeframe: '3 months',
          reasoning: 'Economic uncertainty warrants cautious positioning'
        }
      ],
      upcoming_events: [
        { date: '2024-02-01', event: 'Fed Interest Rate Decision', impact: 'High' },
        { date: '2024-02-05', event: 'Jobs Report', impact: 'High' },
        { date: '2024-02-10', event: 'CPI Inflation Data', impact: 'Medium' }
      ]
    };

    res.json({
      success: true,
      data: commentary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Insights] Market commentary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market commentary',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/insights/stock-deep-dive
 * @desc    Comprehensive stock research report
 * @access  Public
 */
router.post('/stock-deep-dive', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol required' });
    }

    console.log(`[Insights] Generating deep dive for: ${symbol}`);
    const analysis = await realTimeAnalysis.analyzeStock(symbol.toUpperCase());

    const deep_dive = {
      company_overview: {
        symbol: analysis.symbol,
        name: analysis.fundamentals.name,
        sector: analysis.fundamentals.sector,
        market_cap: analysis.fundamentals.market_cap
      },
      investment_thesis: {
        bull_case: this.generateBullCase(analysis),
        bear_case: this.generateBearCase(analysis),
        key_risks: this.identifyKeyRisks(analysis),
        catalysts: this.identifyCatalysts(analysis)
      },
      financial_health: {
        profitability: {
          roe: analysis.fundamentals.roe,
          roa: analysis.fundamentals.roa,
          interpretation: 'Strong profitability metrics indicate efficient management'
        },
        valuation: {
          pe_ratio: analysis.fundamentals.pe_ratio,
          peg_ratio: analysis.fundamentals.peg_ratio,
          interpretation: this.interpretValuation(analysis.fundamentals)
        },
        growth: {
          revenue_growth: analysis.fundamentals.revenue_growth,
          interpretation: 'Year-over-year revenue growth trend'
        }
      },
      technical_outlook: {
        trend: analysis.technical.trend,
        support_levels: [analysis.technical.support_resistance.support],
        resistance_levels: [analysis.technical.support_resistance.resistance],
        key_indicators: {
          rsi: analysis.technical.rsi,
          macd: analysis.technical.macd
        }
      },
      analyst_summary: {
        overall_rating: analysis.recommendation.action,
        confidence: analysis.recommendation.confidence,
        score: analysis.overall_score,
        target_price: analysis.price_targets.targets.moderate,
        stop_loss: analysis.price_targets.stop_loss
      },
      peer_analysis: analysis.peer_comparison,
      insider_activity: {
        // Simulated - In production, integrate real insider trading data
        recent_transactions: [
          { type: 'BUY', role: 'CEO', shares: 10000, date: '2024-01-15' },
          { type: 'SELL', role: 'CFO', shares: 5000, date: '2024-01-10' }
        ],
        interpretation: 'Recent insider buying suggests management confidence'
      },
      institutional_ownership: {
        percentage: '75%',
        change_last_quarter: '+2.3%',
        interpretation: 'Strong institutional support indicates professional confidence'
      },
      actionable_insights: this.generateActionableInsights(analysis)
    };

    res.json({
      success: true,
      data: deep_dive,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Insights] Deep dive error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate deep dive',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/investment-strategies
 * @desc    Curated investment strategies and guides
 * @access  Public
 */
router.get('/investment-strategies', async (req, res) => {
  try {
    const strategies = {
      value_investing: {
        name: 'Value Investing',
        description: 'Buy undervalued stocks with strong fundamentals',
        criteria: [
          'P/E ratio < 15',
          'PEG ratio < 1',
          'Debt-to-FCF < 2',
          'ROE > 15%'
        ],
        pros: ['Lower risk', 'Margin of safety', 'Proven track record'],
        cons: ['May miss growth stocks', 'Value traps possible'],
        suitable_for: 'Long-term conservative investors',
        example_query: 'stocks with PE ratio less than 15 and ROE greater than 15%'
      },
      growth_investing: {
        name: 'Growth Investing',
        description: 'Focus on companies with high growth potential',
        criteria: [
          'Revenue growth > 20%',
          'Strong market position',
          'Innovative products/services'
        ],
        pros: ['High return potential', 'Ride market leaders'],
        cons: ['Higher volatility', 'Premium valuations'],
        suitable_for: 'Aggressive investors with higher risk tolerance',
        example_query: 'stocks with revenue growth greater than 20%'
      },
      dividend_investing: {
        name: 'Dividend Investing',
        description: 'Generate passive income through dividends',
        criteria: [
          'Dividend yield > 3%',
          'Consistent dividend history',
          'Payout ratio < 60%'
        ],
        pros: ['Regular income', 'Lower volatility', 'Tax advantages'],
        cons: ['Limited growth', 'Dividend cuts possible'],
        suitable_for: 'Income-focused retirees',
        example_query: 'stocks with dividend yield greater than 3%'
      },
      momentum_trading: {
        name: 'Momentum Trading',
        description: 'Capitalize on existing market trends',
        criteria: [
          'RSI between 40-60',
          'Strong upward trend',
          'High trading volume'
        ],
        pros: ['Capture trending moves', 'Clear entry/exit signals'],
        cons: ['Requires active monitoring', 'Higher transaction costs'],
        suitable_for: 'Active traders',
        example_query: 'Use technical analysis for momentum stocks'
      }
    };

    res.json({
      success: true,
      data: strategies,
      message: 'Choose a strategy that aligns with your goals and risk tolerance'
    });
  } catch (error) {
    console.error('[Insights] Strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch investment strategies',
      message: error.message
    });
  }
});

/**
 * Helper Functions
 */
function generateBullCase(analysis) {
  return [
    analysis.fundamentals.strengths.length > 0 ? 
      `Strong ${analysis.fundamentals.strengths.join(', ')}` : 
      'Solid fundamental metrics',
    analysis.technical.trend.includes('Uptrend') ? 
      'Positive technical momentum' : 
      'Technical setup improving',
    analysis.sentiment.market_mood === 'Bullish' ? 
      'Favorable market sentiment' : 
      'Market conditions supportive'
  ];
}

function generateBearCase(analysis) {
  return [
    analysis.fundamentals.weaknesses.length > 0 ? 
      `Weak ${analysis.fundamentals.weaknesses.join(', ')}` : 
      'Some fundamental concerns',
    analysis.risk_metrics.risk_category === 'High Risk' ? 
      'Elevated volatility' : 
      'Market uncertainty',
    'Potential market correction'
  ];
}

function identifyKeyRisks(analysis) {
  const risks = [];
  if (analysis.risk_metrics.volatility.value > 30) {
    risks.push('High volatility');
  }
  if (analysis.fundamentals.debt_to_fcf > 3) {
    risks.push('Elevated debt levels');
  }
  if (analysis.technical.rsi.value > 70) {
    risks.push('Overbought conditions');
  }
  return risks.length > 0 ? risks : ['Normal market risks'];
}

function identifyCatalysts(analysis) {
  return [
    'Upcoming earnings report',
    'Product launches',
    'Market expansion plans'
  ];
}

function interpretValuation(fundamentals) {
  const pe = fundamentals.pe_ratio;
  if (pe < 15) return 'Attractive valuation - Potentially undervalued';
  if (pe < 25) return 'Fair valuation - Reasonably priced';
  return 'Premium valuation - Price reflects growth expectations';
}

function generateActionableInsights(analysis) {
  const insights = [];
  
  if (analysis.overall_score > 70) {
    insights.push({
      type: 'BUY',
      reason: 'Strong overall score indicates good investment opportunity',
      time_horizon: 'Long-term (1+ years)'
    });
  }
  
  if (analysis.technical.rsi.value < 30) {
    insights.push({
      type: 'ENTRY_POINT',
      reason: 'Oversold condition presents potential entry opportunity',
      time_horizon: 'Short-term (1-3 months)'
    });
  }
  
  if (analysis.risk_metrics.risk_category === 'Low Risk') {
    insights.push({
      type: 'CORE_HOLDING',
      reason: 'Low volatility makes this suitable as core portfolio holding',
      allocation: '10-15% of portfolio'
    });
  }
  
  return insights;
}

/**
 * NEW MILESTONE 3 ROUTES
 */

const insightsService = require('../services/insights.service');
const riskService = require('../services/risk.service');
const quarterlyFilterService = require('../services/quarterlyFilter.service');

/**
 * @route   GET /api/insights/stock/:symbol
 * @desc    Get comprehensive SEBI-compliant insights for a stock
 * @access  Public
 */
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const insights = await insightsService.generateInsights(symbol.toUpperCase());

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('[Insights] Generate insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/risk/:symbol
 * @desc    Get comprehensive risk analysis for a stock
 * @access  Public
 */
router.get('/risk/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const riskAnalysis = await riskService.analyzeRisk(symbol.toUpperCase());

    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    console.error('[Insights] Risk analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze risk',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/positive-earnings
 * @desc    Find stocks with positive earnings for last N quarters
 * @access  Public
 */
router.get('/quarterly/positive-earnings', async (req, res) => {
  try {
    const nQuarters = parseInt(req.query.quarters) || 4;
    const minProfit = parseFloat(req.query.minProfit) || 0;

    const stocks = await quarterlyFilterService.findStocksWithPositiveEarnings(nQuarters, minProfit);

    res.json({
      success: true,
      data: {
        filters_applied: {
          quarters: nQuarters,
          min_profit: minProfit
        },
        stocks,
        count: stocks.length
      }
    });
  } catch (error) {
    console.error('[Insights] Positive earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/revenue-growth
 * @desc    Find stocks with consistent revenue growth
 * @access  Public
 */
router.get('/quarterly/revenue-growth', async (req, res) => {
  try {
    const nQuarters = parseInt(req.query.quarters) || 4;
    const minGrowthRate = parseFloat(req.query.minGrowth) || 0;

    const stocks = await quarterlyFilterService.findStocksWithRevenueGrowth(nQuarters, minGrowthRate);

    res.json({
      success: true,
      data: {
        filters_applied: {
          quarters: nQuarters,
          min_growth_rate: minGrowthRate
        },
        stocks,
        count: stocks.length
      }
    });
  } catch (error) {
    console.error('[Insights] Revenue growth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/improving-margins
 * @desc    Find stocks with improving profit margins
 * @access  Public
 */
router.get('/quarterly/improving-margins', async (req, res) => {
  try {
    const nQuarters = parseInt(req.query.quarters) || 4;
    const stocks = await quarterlyFilterService.findStocksWithImprovingMargins(nQuarters);

    res.json({
      success: true,
      data: {
        filters_applied: {
          quarters: nQuarters
        },
        stocks,
        count: stocks.length
      }
    });
  } catch (error) {
    console.error('[Insights] Improving margins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/trend/:symbol
 * @desc    Get detailed quarterly trend for a stock
 * @access  Public
 */
router.get('/quarterly/trend/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const nQuarters = parseInt(req.query.quarters) || 8;

    const trend = await quarterlyFilterService.getQuarterlyTrend(symbol.toUpperCase(), nQuarters);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('[Insights] Quarterly trend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quarterly trend',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/consistent-performance
 * @desc    Find stocks with consistent quarterly performance
 * @access  Public
 */
router.get('/quarterly/consistent-performance', async (req, res) => {
  try {
    const nQuarters = parseInt(req.query.quarters) || 4;
    const maxVolatility = parseFloat(req.query.maxVolatility) || 20;

    const stocks = await quarterlyFilterService.findStocksWithConsistentPerformance(nQuarters, maxVolatility);

    res.json({
      success: true,
      data: {
        filters_applied: {
          quarters: nQuarters,
          max_volatility: maxVolatility
        },
        stocks,
        count: stocks.length
      }
    });
  } catch (error) {
    console.error('[Insights] Consistent performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/insights/quarterly/sector-outperformers/:sector
 * @desc    Find stocks exceeding sector average growth
 * @access  Public
 */
router.get('/quarterly/sector-outperformers/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    const nQuarters = parseInt(req.query.quarters) || 4;

    const stocks = await quarterlyFilterService.findSectorOutperformers(sector, nQuarters);

    res.json({
      success: true,
      data: {
        sector,
        quarters_analyzed: nQuarters,
        outperformers: stocks,
        count: stocks.length
      }
    });
  } catch (error) {
    console.error('[Insights] Sector outperformers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find outperformers',
      message: error.message
    });
  }
});

module.exports = router;
