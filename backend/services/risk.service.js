/**
 * Risk Analysis Engine
 * Comprehensive risk scoring and analysis
 */

const pool = require("../database");

class RiskAnalysisService {
  /**
   * Perform comprehensive risk analysis for a stock
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Risk analysis with scoring
   */
  async analyzeRisk(symbol) {
    try {
      const [debtRisk, earningsRisk, valuationRisk, growthRisk, sectorRisk] = await Promise.all([
        this.assessDebtRisk(symbol),
        this.assessEarningsRisk(symbol),
        this.assessValuationRisk(symbol),
        this.assessGrowthRisk(symbol),
        this.assessSectorRisk(symbol)
      ]);

      const overallScore = this.calculateOverallRiskScore({
        debtRisk,
        earningsRisk,
        valuationRisk,
        growthRisk,
        sectorRisk
      });

      return {
        symbol,
        timestamp: new Date().toISOString(),
        overall_risk_level: overallScore.level,
        overall_risk_score: overallScore.score,
        risk_breakdown: {
          debt_risk: debtRisk,
          earnings_risk: earningsRisk,
          valuation_risk: valuationRisk,
          growth_risk: growthRisk,
          sector_risk: sectorRisk
        },
        risk_summary: this.generateRiskSummary(overallScore, {
          debtRisk,
          earningsRisk,
          valuationRisk,
          growthRisk,
          sectorRisk
        }),
        mitigation_insights: this.generateMitigationInsights({
          debtRisk,
          earningsRisk,
          valuationRisk,
          growthRisk
        })
      };
    } catch (error) {
      console.error("Analyze risk error:", error);
      throw error;
    }
  }

  /**
   * Assess debt/leverage risk
   */
  async assessDebtRisk(symbol) {
    try {
      const result = await pool.query(
        `SELECT debt_to_fcf
         FROM fundamentals
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0 || !result.rows[0].debt_to_fcf) {
        return {
          score: 50,
          level: 'MEDIUM',
          message: 'Debt data not available',
          available: false
        };
      }

      const debtToFcf = parseFloat(result.rows[0].debt_to_fcf);
      let score, level, explanation;

      if (debtToFcf < 0.3) {
        score = 20;
        level = 'LOW';
        explanation = 'Healthy debt levels with strong free cash flow coverage';
      } else if (debtToFcf < 0.5) {
        score = 40;
        level = 'LOW-MEDIUM';
        explanation = 'Moderate debt levels - manageable but monitor closely';
      } else if (debtToFcf < 0.8) {
        score = 70;
        level = 'MEDIUM-HIGH';
        explanation = 'Elevated debt levels require attention';
      } else {
        score = 90;
        level = 'HIGH';
        explanation = 'High debt burden relative to cash generation';
      }

      return {
        score,
        level,
        debt_to_fcf: debtToFcf,
        explanation,
        available: true,
        recommendation: this.getDebtRiskRecommendation(level)
      };
    } catch (error) {
      console.error("Assess debt risk error:", error);
      throw error;
    }
  }

  /**
   * Assess earnings stability risk
   */
  async assessEarningsRisk(symbol) {
    try {
      const result = await pool.query(
        `SELECT quarter, profit
         FROM quarterly_financials
         WHERE company_id = $1
         ORDER BY quarter DESC
         LIMIT 8`,
        [symbol]
      );

      if (result.rows.length < 4) {
        return {
          score: 50,
          level: 'MEDIUM',
          message: 'Insufficient earnings history',
          available: false
        };
      }

      const profits = result.rows.map(r => parseFloat(r.profit));
      
      // Calculate volatility
      const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
      const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avgProfit) * 100;

      // Check for negative earnings
      const negativeQuarters = profits.filter(p => p < 0).length;
      const positiveStreak = this.calculatePositiveStreak(profits);

      let score, level, explanation;

      if (negativeQuarters === 0 && coefficientOfVariation < 15 && positiveStreak >= 4) {
        score = 20;
        level = 'LOW';
        explanation = 'Stable and consistent earnings history';
      } else if (negativeQuarters <= 1 && coefficientOfVariation < 30) {
        score = 40;
        level = 'LOW-MEDIUM';
        explanation = 'Generally stable earnings with minor fluctuations';
      } else if (negativeQuarters <= 2 || coefficientOfVariation < 50) {
        score = 70;
        level = 'MEDIUM-HIGH';
        explanation = 'Earnings volatility observed - inconsistent profitability';
      } else {
        score = 90;
        level = 'HIGH';
        explanation = 'High earnings volatility - significant uncertainty';
      }

      return {
        score,
        level,
        explanation,
        available: true,
        metrics: {
          negative_quarters: negativeQuarters,
          volatility: coefficientOfVariation.toFixed(2),
          positive_streak: positiveStreak,
          quarters_analyzed: profits.length
        }
      };
    } catch (error) {
      console.error("Assess earnings risk error:", error);
      throw error;
    }
  }

  /**
   * Assess valuation risk
   */
  async assessValuationRisk(symbol) {
    try {
      const result = await pool.query(
        `SELECT pe_ratio, peg_ratio
         FROM fundamentals
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0 || !result.rows[0].pe_ratio) {
        return {
          score: 50,
          level: 'MEDIUM',
          message: 'Valuation data not available',
          available: false
        };
      }

      const { pe_ratio, peg_ratio } = result.rows[0];
      const peRatio = parseFloat(pe_ratio);
      const pegRatio = peg_ratio ? parseFloat(peg_ratio) : null;

      let score, level, explanation;

      if (peRatio < 15 && (!pegRatio || pegRatio < 1.5)) {
        score = 20;
        level = 'LOW';
        explanation = 'Attractive valuation with limited downside risk';
      } else if (peRatio < 25) {
        score = 40;
        level = 'LOW-MEDIUM';
        explanation = 'Fair valuation - reasonable entry point';
      } else if (peRatio < 40) {
        score = 70;
        level = 'MEDIUM-HIGH';
        explanation = 'Premium valuation - vulnerable to market corrections';
      } else {
        score = 90;
        level = 'HIGH';
        explanation = 'Very high valuation - significant correction risk';
      }

      return {
        score,
        level,
        explanation,
        available: true,
        metrics: {
          pe_ratio: peRatio,
          peg_ratio: pegRatio,
          valuation_category: this.categorizeValuation(peRatio)
        }
      };
    } catch (error) {
      console.error("Assess valuation risk error:", error);
      throw error;
    }
  }

  /**
   * Assess growth risk
   */
  async assessGrowthRisk(symbol) {
    try {
      const result = await pool.query(
        `SELECT revenue_growth
         FROM fundamentals
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0 || !result.rows[0].revenue_growth) {
        return {
          score: 50,
          level: 'MEDIUM',
          message: 'Growth data not available',
          available: false
        };
      }

      const revenueGrowth = parseFloat(result.rows[0].revenue_growth);
      let score, level, explanation;

      if (revenueGrowth > 20) {
        score = 20;
        level: 'LOW';
        explanation = 'Strong growth trajectory reduces business risk';
      } else if (revenueGrowth > 10) {
        score = 35;
        level = 'LOW-MEDIUM';
        explanation = 'Healthy growth supporting business expansion';
      } else if (revenueGrowth > 0) {
        score = 60;
        level = 'MEDIUM';
        explanation = 'Modest growth - limited expansion momentum';
      } else {
        score = 85;
        level = 'HIGH';
        explanation = 'Revenue contraction indicates business challenges';
      }

      return {
        score,
        level,
        explanation,
        available: true,
        metrics: {
          revenue_growth_rate: revenueGrowth,
          growth_category: this.categorizeGrowth(revenueGrowth)
        }
      };
    } catch (error) {
      console.error("Assess growth risk error:", error);
      throw error;
    }
  }

  /**
   * Assess sector-specific risk
   */
  async assessSectorRisk(symbol) {
    try {
      const result = await pool.query(
        `SELECT sector
         FROM companies
         WHERE symbol = $1`,
        [symbol]
      );

      if (result.rows.length === 0) {
        return {
          score: 50,
          level: 'MEDIUM',
          message: 'Sector data not available',
          available: false
        };
      }

      const sector = result.rows[0].sector;
      const sectorRiskProfile = this.getSectorRiskProfile(sector);

      return {
        score: sectorRiskProfile.score,
        level: sectorRiskProfile.level,
        sector: sector,
        explanation: sectorRiskProfile.explanation,
        available: true,
        factors: sectorRiskProfile.factors
      };
    } catch (error) {
      console.error("Assess sector risk error:", error);
      throw error;
    }
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRiskScore(risks) {
    const weights = {
      debtRisk: 0.25,
      earningsRisk: 0.30,
      valuationRisk: 0.20,
      growthRisk: 0.15,
      sectorRisk: 0.10
    };

    const weightedScore = 
      (risks.debtRisk.score * weights.debtRisk) +
      (risks.earningsRisk.score * weights.earningsRisk) +
      (risks.valuationRisk.score * weights.valuationRisk) +
      (risks.growthRisk.score * weights.growthRisk) +
      (risks.sectorRisk.score * weights.sectorRisk);

    let level;
    if (weightedScore < 30) level = 'LOW';
    else if (weightedScore < 50) level = 'MEDIUM';
    else if (weightedScore < 70) level = 'HIGH';
    else level = 'VERY HIGH';

    return {
      score: weightedScore.toFixed(1),
      level,
      interpretation: this.interpretRiskLevel(level)
    };
  }

  /**
   * Generate risk summary
   */
  generateRiskSummary(overallScore, risks) {
    const topRisks = Object.entries(risks)
      .filter(([key, risk]) => risk.available && risk.score > 60)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 3)
      .map(([key, risk]) => ({
        type: key.replace('Risk', '').toUpperCase(),
        level: risk.level,
        concern: risk.explanation
      }));

    return {
      overall_assessment: overallScore.interpretation,
      primary_concerns: topRisks,
      investor_suitability: this.determineInvestorSuitability(overallScore.level)
    };
  }

  /**
   * Generate mitigation insights
   */
  generateMitigationInsights(risks) {
    const insights = [];

    if (risks.debtRisk.available && risks.debtRisk.score > 60) {
      insights.push({
        risk_type: 'DEBT',
        mitigation: 'Monitor debt reduction progress and interest coverage ratios quarterly'
      });
    }

    if (risks.earningsRisk.available && risks.earningsRisk.score > 60) {
      insights.push({
        risk_type: 'EARNINGS',
        mitigation: 'Diversify holdings to reduce exposure to earnings volatility'
      });
    }

    if (risks.valuationRisk.available && risks.valuationRisk.score > 70) {
      insights.push({
        risk_type: 'VALUATION',
        mitigation: 'Consider dollar-cost averaging to mitigate valuation risk over time'
      });
    }

    if (risks.growthRisk.available && risks.growthRisk.score > 70) {
      insights.push({
        risk_type: 'GROWTH',
        mitigation: 'Closely track quarterly results for signs of recovery or further decline'
      });
    }

    return insights;
  }

  // Helper methods

  calculatePositiveStreak(profits) {
    let streak = 0;
    for (let i = 0; i < profits.length; i++) {
      if (profits[i] > 0) streak++;
      else break;
    }
    return streak;
  }

  categorizeValuation(peRatio) {
    if (peRatio < 15) return 'Undervalued';
    if (peRatio < 25) return 'Fair';
    if (peRatio < 35) return 'Premium';
    return 'Expensive';
  }

  categorizeGrowth(growth) {
    if (growth > 20) return 'High Growth';
    if (growth > 10) return 'Moderate Growth';
    if (growth > 0) return 'Slow Growth';
    return 'Declining';
  }

  getSectorRiskProfile(sector) {
    const profiles = {
      'IT': {
        score: 40,
        level: 'LOW-MEDIUM',
        explanation: 'IT sector generally stable with global demand',
        factors: ['Currency risk', 'Client concentration', 'Technology disruption']
      },
      'Finance': {
        score: 50,
        level: 'MEDIUM',
        explanation: 'Financial sector sensitive to regulatory and economic changes',
        factors: ['Interest rate risk', 'Credit risk', 'Regulatory changes']
      },
      'Pharma': {
        score: 55,
        level: 'MEDIUM',
        explanation: 'Pharmaceutical sector faces regulatory and IP risks',
        factors: ['Regulatory approvals', 'Patent cliffs', 'Pricing pressure']
      },
      'Manufacturing': {
        score: 60,
        level: 'MEDIUM-HIGH',
        explanation: 'Manufacturing exposed to commodity prices and demand cycles',
        factors: ['Raw material costs', 'Demand volatility', 'Competition']
      }
    };

    return profiles[sector] || {
      score: 50,
      level: 'MEDIUM',
      explanation: 'Standard sector risk profile',
      factors: ['Market competition', 'Economic cycles', 'Regulatory environment']
    };
  }

  getDebtRiskRecommendation(level) {
    const recommendations = {
      'LOW': 'Debt levels are healthy - no immediate concerns',
      'LOW-MEDIUM': 'Monitor debt servicing capability in quarterly results',
      'MEDIUM-HIGH': 'Track debt reduction initiatives closely',
      'HIGH': 'High debt is a significant risk factor - avoid if risk-averse'
    };
    return recommendations[level] || 'Monitor debt levels';
  }

  interpretRiskLevel(level) {
    const interpretations = {
      'LOW': 'Stock exhibits low overall risk - suitable for conservative investors',
      'MEDIUM': 'Moderate risk profile - appropriate for balanced portfolios',
      'HIGH': 'Elevated risk levels - suitable only for risk-tolerant investors',
      'VERY HIGH': 'High risk investment - requires thorough due diligence and risk appetite'
    };
    return interpretations[level];
  }

  determineInvestorSuitability(riskLevel) {
    const suitability = {
      'LOW': 'Conservative to Moderate investors',
      'MEDIUM': 'Moderate to Aggressive investors',
      'HIGH': 'Aggressive investors only',
      'VERY HIGH': 'Very aggressive investors with high risk tolerance'
    };
    return suitability[riskLevel];
  }
}

module.exports = new RiskAnalysisService();
