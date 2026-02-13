/**
 * Condition Evaluation Engine
 * Evaluates stock conditions and triggers alerts on state changes
 * Implements idempotent pattern: getLastEvaluation -> evaluateCondition -> storeEvaluation -> triggerAction
 */

const pool = require("../database");
const alertService = require("./alert.service");
const auditService = require("./audit.service");

class ConditionEvaluationService {
  /**
   * Evaluate a condition for a user + stock combination
   * @param {Object} params - Evaluation parameters
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateCondition(params) {
    const {
      userId,
      companyId,
      evaluationType, // 'portfolio', 'screener', 'watchlist'
      conditionKey,   // e.g., 'pe_ratio_below_20', 'revenue_growth_high'
      conditionFn     // Function that returns current state
    } = params;

    // Validation
    if (!userId || !companyId || !evaluationType || !conditionKey || !conditionFn) {
      throw new Error("Missing required evaluation parameters");
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Step 1: Get last evaluation state
      const lastEvaluation = await this.getLastEvaluation(
        userId, 
        companyId, 
        evaluationType, 
        conditionKey,
        client
      );

      // Step 2: Evaluate current condition
      const currentState = await conditionFn();

      // Step 3: Compare states and determine if changed
      const stateChanged = this.hasStateChanged(
        lastEvaluation?.current_state,
        currentState
      );

      // Step 4: Store evaluation
      const evaluation = await this.storeEvaluation({
        userId,
        companyId,
        evaluationType,
        conditionKey,
        previousState: lastEvaluation?.current_state || null,
        currentState,
        stateChanged
      }, client);

      // Step 5: Trigger action if state changed
      let alert = null;
      if (stateChanged) {
        alert = await this.triggerAction({
          userId,
          companyId,
          evaluationType,
          conditionKey,
          previousState: lastEvaluation?.current_state || null,
          currentState,
          evaluation
        }, client);
      }

      await client.query('COMMIT');

      return {
        evaluation,
        stateChanged,
        alert,
        previousState: lastEvaluation?.current_state || null,
        currentState
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Condition evaluation error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get last evaluation for a condition
   * @private
   */
  async getLastEvaluation(userId, companyId, evaluationType, conditionKey, client) {
    const result = await client.query(
      `SELECT * FROM condition_evaluations 
       WHERE user_id = $1 
         AND company_id = $2 
         AND evaluation_type = $3 
         AND condition_key = $4
       ORDER BY evaluated_at DESC
       LIMIT 1`,
      [userId, companyId, evaluationType, conditionKey]
    );

    return result.rows[0] || null;
  }

  /**
   * Store evaluation result
   * @private
   */
  async storeEvaluation(data, client) {
    const {
      userId,
      companyId,
      evaluationType,
      conditionKey,
      previousState,
      currentState,
      stateChanged
    } = data;

    const result = await client.query(
      `INSERT INTO condition_evaluations 
        (user_id, company_id, evaluation_type, condition_key, 
         previous_state, current_state, state_changed) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, company_id, evaluation_type, condition_key)
       DO UPDATE SET
         previous_state = EXCLUDED.previous_state,
         current_state = EXCLUDED.current_state,
         state_changed = EXCLUDED.state_changed,
         evaluated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        companyId,
        evaluationType,
        conditionKey,
        previousState ? JSON.stringify(previousState) : null,
        JSON.stringify(currentState),
        stateChanged
      ]
    );

    // Audit log
    await auditService.log({
      userId,
      entityType: 'evaluation',
      entityId: result.rows[0].id,
      action: 'evaluate',
      description: `Evaluated condition: ${conditionKey}`,
      metadata: { 
        evaluation_type: evaluationType, 
        condition_key: conditionKey,
        state_changed: stateChanged 
      }
    }, client);

    return result.rows[0];
  }

  /**
   * Compare states to determine if changed
   * @private
   */
  hasStateChanged(previousState, currentState) {
    if (!previousState) {
      return true; // First evaluation is always a "change"
    }

    const normalizeState = (state) => {
      if (!state || typeof state !== 'object') {
        return state;
      }

      const normalized = { ...state };
      delete normalized.evaluated_at;
      return normalized;
    };

    // Deep comparison without timestamp noise
    return JSON.stringify(normalizeState(previousState)) !== JSON.stringify(normalizeState(currentState));
  }

  /**
   * Trigger action (create alert) when state changes
   * @private
   */
  async triggerAction(data, client) {
    const {
      userId,
      companyId,
      evaluationType,
      conditionKey,
      previousState,
      currentState,
      evaluation
    } = data;

    // Generate alert details based on condition
    const alertDetails = this.generateAlertDetails(
      conditionKey,
      previousState,
      currentState
    );

    // Create alert
    const alert = await alertService.createAlert({
      userId,
      companyId,
      alertType: conditionKey,
      severity: alertDetails.severity,
      title: alertDetails.title,
      description: alertDetails.description,
      previousValue: previousState,
      currentValue: currentState,
      metadata: {
        evaluation_type: evaluationType,
        evaluation_id: evaluation.id,
        ...alertDetails.metadata
      }
    });

    console.log(`[Evaluation] Triggered alert for ${conditionKey}: ${alertDetails.title}`);

    return alert;
  }

  /**
   * Generate alert details based on condition type
   * @private
   */
  generateAlertDetails(conditionKey, previousState, currentState) {
    // Default alert template
    const defaultAlert = {
      severity: 'medium',
      title: `Condition Changed: ${conditionKey}`,
      description: `The condition "${conditionKey}" has changed`,
      metadata: {}
    };

    // Condition-specific alert generation
    const alertGenerators = {
      'pe_ratio_below_20': () => {
        const pe = currentState.pe_ratio;
        return {
          severity: pe < 15 ? 'high' : 'medium',
          title: `PE Ratio Alert: ${currentState.symbol}`,
          description: `PE Ratio is ${pe.toFixed(2)}${pe < 15 ? ' - Attractive valuation!' : ''}`,
          metadata: { pe_ratio: pe, threshold: 20 }
        };
      },
      'pe_ratio_change': () => {
        const oldPe = previousState?.pe_ratio || 0;
        const newPe = currentState.pe_ratio;
        const change = oldPe === 0 ? null : ((newPe - oldPe) / oldPe * 100).toFixed(2);
        const changeLabel = change === null ? 'N/A' : `${change > 0 ? '+' : ''}${change}%`;
        return {
          severity: change === null ? 'medium' : Math.abs(change) > 20 ? 'high' : 'medium',
          title: `PE Ratio Changed: ${currentState.symbol}`,
          description: `PE Ratio changed from ${oldPe.toFixed(2)} to ${newPe.toFixed(2)} (${changeLabel})`,
          metadata: { old_pe: oldPe, new_pe: newPe, change_percent: change ?? 'N/A' }
        };
      },
      'revenue_growth_high': () => {
        const growth = currentState.revenue_growth;
        return {
          severity: growth > 30 ? 'high' : 'medium',
          title: `Strong Revenue Growth: ${currentState.symbol}`,
          description: `Revenue growth is ${growth.toFixed(2)}% - Strong performance!`,
          metadata: { revenue_growth: growth, threshold: 15 }
        };
      },
      'market_cap_change': () => {
        const oldCap = previousState?.market_cap || 0;
        const newCap = currentState.market_cap;
        const change = ((newCap - oldCap) / oldCap * 100).toFixed(2);
        return {
          severity: Math.abs(change) > 10 ? 'high' : 'medium',
          title: `Market Cap Changed: ${currentState.symbol}`,
          description: `Market cap changed by ${change > 0 ? '+' : ''}${change}%`,
          metadata: { old_market_cap: oldCap, new_market_cap: newCap, change_percent: change }
        };
      }
    };

    // Use specific generator if available, otherwise default
    const generator = alertGenerators[conditionKey];
    return generator ? generator() : defaultAlert;
  }

  /**
   * Evaluate all portfolio stocks for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Evaluation results
   */
  async evaluateUserPortfolio(userId) {
    try {
      // Get user's portfolio
      const portfolioResult = await pool.query(
        `SELECT 
          pi.user_id,
          pi.company_id,
          c.symbol,
          c.name,
          f.pe_ratio,
          f.revenue_growth,
          f.market_cap,
          f.eps
         FROM portfolio_items pi
         INNER JOIN companies c ON pi.company_id = c.id
         LEFT JOIN fundamentals f ON c.symbol = f.symbol
         WHERE pi.user_id = $1`,
        [userId]
      );

      const results = [];

      // Evaluate each stock
      for (const item of portfolioResult.rows) {
        // Evaluate PE ratio condition
        const peEvaluation = await this.evaluateCondition({
          userId,
          companyId: item.company_id,
          evaluationType: 'portfolio',
          conditionKey: 'pe_ratio_change',
          conditionFn: async () => ({
            symbol: item.symbol,
            pe_ratio: parseFloat(item.pe_ratio) || 0,
            evaluated_at: new Date()
          })
        });

        results.push({
          stock: item.symbol,
          condition: 'pe_ratio_change',
          result: peEvaluation
        });

        // Evaluate revenue growth condition
        const revenueEvaluation = await this.evaluateCondition({
          userId,
          companyId: item.company_id,
          evaluationType: 'portfolio',
          conditionKey: 'revenue_growth_high',
          conditionFn: async () => ({
            symbol: item.symbol,
            revenue_growth: parseFloat(item.revenue_growth) || 0,
            evaluated_at: new Date()
          })
        });

        results.push({
          stock: item.symbol,
          condition: 'revenue_growth_high',
          result: revenueEvaluation
        });
      }

      return results;
    } catch (error) {
      console.error("Evaluate user portfolio error:", error);
      throw error;
    }
  }

  /**
   * Get evaluation history for a stock
   * @param {number} userId - User ID
   * @param {number} companyId - Company ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} Evaluation history
   */
  async getEvaluationHistory(userId, companyId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM condition_evaluations 
         WHERE user_id = $1 AND company_id = $2 
         ORDER BY evaluated_at DESC 
         LIMIT $3`,
        [userId, companyId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error("Get evaluation history error:", error);
      throw error;
    }
  }
}

module.exports = new ConditionEvaluationService();
