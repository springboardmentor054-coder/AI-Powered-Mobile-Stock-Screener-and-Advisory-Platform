/**
 * Background Evaluation Scheduler
 * Periodically evaluates saved screeners and user portfolios
 * Triggers alerts when conditions change
 */

const pool = require("../database");
const conditionEvaluation = require("./conditionEvaluation.service");
const alertService = require("./alert.service");
const auditService = require("./audit.service");

class BackgroundEvaluatorService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.evaluationInterval = parseInt(process.env.EVALUATION_INTERVAL_MS) || 3600000; // 1 hour default
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunAt: null,
      lastRunDuration: 0,
      alertsTriggered: 0
    };
  }

  /**
   * Start the background evaluation cycle
   * @param {number} intervalMs - Interval in milliseconds (optional)
   */
  start(intervalMs = null) {
    if (this.isRunning) {
      console.log("[BackgroundEvaluator] Already running");
      return;
    }

    const interval = intervalMs || this.evaluationInterval;
    
    console.log(`[BackgroundEvaluator] Starting with interval: ${interval}ms (${interval / 60000} minutes)`);
    
    this.isRunning = true;
    
    // Run immediately on start
    this.runEvaluationCycle();
    
    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runEvaluationCycle();
    }, interval);

    console.log("[BackgroundEvaluator] Started successfully");
  }

  /**
   * Stop the background evaluation cycle
   */
  stop() {
    if (!this.isRunning) {
      console.log("[BackgroundEvaluator] Not running");
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log("[BackgroundEvaluator] Stopped");
  }

  /**
   * Run a single evaluation cycle
   */
  async runEvaluationCycle() {
    const startTime = Date.now();
    this.stats.totalRuns++;
    
    console.log("\n" + "=".repeat(60));
    console.log(`[BackgroundEvaluator] Starting evaluation cycle #${this.stats.totalRuns}`);
    console.log(`[BackgroundEvaluator] Time: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    try {
      // Step 1: Evaluate all user portfolios
      await this.evaluateAllPortfolios();

      // Step 2: Evaluate saved screeners
      await this.evaluateSavedScreeners();

      // Step 3: Cleanup expired alerts
      await this.cleanupExpiredAlerts();

      // Update stats
      const duration = Date.now() - startTime;
      this.stats.successfulRuns++;
      this.stats.lastRunAt = new Date();
      this.stats.lastRunDuration = duration;

      console.log("=".repeat(60));
      console.log(`[BackgroundEvaluator] Cycle completed successfully`);
      console.log(`[BackgroundEvaluator] Duration: ${duration}ms`);
      console.log("=".repeat(60) + "\n");

    } catch (error) {
      this.stats.failedRuns++;
      console.error("[BackgroundEvaluator] Cycle failed:", error);
      console.error("[BackgroundEvaluator] Stack:", error.stack);
      
      // Log failure but don't crash
      await auditService.log({
        entityType: 'system',
        action: 'evaluation_cycle_failed',
        description: 'Background evaluation cycle failed',
        metadata: { error: error.message, stack: error.stack }
      }).catch(err => console.error("Failed to log audit:", err));
    }
  }

  /**
   * Evaluate all user portfolios
   * @private
   */
  async evaluateAllPortfolios() {
    console.log("[BackgroundEvaluator] Evaluating all portfolios...");
    
    try {
      // Get all users with portfolio items
      const usersResult = await pool.query(
        `SELECT DISTINCT u.id, u.email, u.name, COUNT(pi.id) as portfolio_count
         FROM users u
         INNER JOIN portfolio_items pi ON u.id = pi.user_id
         GROUP BY u.id, u.email, u.name`
      );

      const users = usersResult.rows;
      console.log(`[BackgroundEvaluator] Found ${users.length} users with portfolios`);

      let totalEvaluations = 0;
      let alertsTriggered = 0;

      for (const user of users) {
        try {
          console.log(`[BackgroundEvaluator] Evaluating portfolio for user: ${user.email} (${user.portfolio_count} stocks)`);
          
          const results = await conditionEvaluation.evaluateUserPortfolio(user.id);
          totalEvaluations += results.length;
          
          // Count state changes (potential alerts)
          const stateChanges = results.filter(r => r.result.stateChanged);
          alertsTriggered += stateChanges.length;
          
          if (stateChanges.length > 0) {
            console.log(`[BackgroundEvaluator] Triggered ${stateChanges.length} alerts for ${user.email}`);
          }
        } catch (error) {
          console.error(`[BackgroundEvaluator] Error evaluating portfolio for user ${user.id}:`, error.message);
          // Continue with next user
        }
      }

      this.stats.alertsTriggered += alertsTriggered;
      console.log(`[BackgroundEvaluator] Portfolio evaluation complete: ${totalEvaluations} evaluations, ${alertsTriggered} alerts triggered`);
      
      return { totalEvaluations, alertsTriggered };
    } catch (error) {
      console.error("[BackgroundEvaluator] Error in evaluateAllPortfolios:", error);
      throw error;
    }
  }

  /**
   * Evaluate saved screeners
   * @private
   */
  async evaluateSavedScreeners() {
    console.log("[BackgroundEvaluator] Evaluating saved screeners...");
    
    try {
      // Use the savedScreenersService to get active screeners
      const savedScreenersService = require("./savedScreeners.service");
      const screeners = await savedScreenersService.getActiveScreenersForEvaluation();
      
      console.log(`[BackgroundEvaluator] Found ${screeners.length} active screeners`);

      let totalMatches = 0;
      let alertsTriggered = 0;

      for (const screener of screeners) {
        try {
          // Execute screener query
          const matches = await this.executeScreener(screener);
          totalMatches += matches.length;
          
          console.log(`[BackgroundEvaluator] Screener "${screener.name}" matched ${matches.length} stocks`);
          
          // Create alert if new matches found
          if (matches.length > 0) {
            try {
              await alertService.createAlert(
                screener.user_id,
                'SCREENER_MATCH',
                null, // No specific symbol
                `Your screener "${screener.name}" matched ${matches.length} stocks`,
                {
                  screenerId: screener.screener_id,
                  screenerName: screener.name,
                  matchCount: matches.length,
                  symbols: matches.slice(0, 10).map(m => m.symbol), // First 10 symbols
                  timestamp: new Date().toISOString()
                },
                'MEDIUM'
              );
              alertsTriggered++;
              console.log(`[BackgroundEvaluator] Created screener match alert for user ${screener.user_id}`);
            } catch (alertError) {
              console.error(`[BackgroundEvaluator] Failed to create alert for screener ${screener.screener_id}:`, alertError.message);
            }
          }
          
        } catch (error) {
          console.error(`[BackgroundEvaluator] Error evaluating screener ${screener.screener_id}:`, error.message);
          // Continue with next screener
        }
      }

      this.stats.alertsTriggered += alertsTriggered;
      console.log(`[BackgroundEvaluator] Screener evaluation complete: ${totalMatches} total matches, ${alertsTriggered} alerts triggered`);
      return { screenersEvaluated: screeners.length, totalMatches, alertsTriggered };
    } catch (error) {
      console.error("[BackgroundEvaluator] Error in evaluateSavedScreeners:", error);
      throw error;
    }
  }

  /**
   * Execute a saved screener query
   * @private
   */
  async executeScreener(screener) {
    try {
      // Use the conditionEvaluation service to execute the DSL query
      const { buildQuery } = require("../compileDSL");
      const dslQuery = screener.dsl_query;
      
      // Build SQL query from DSL
      const { query, params } = buildQuery(dslQuery);
      
      // Execute query
      const result = await pool.query(query, params);
      
      return result.rows || [];
    } catch (error) {
      console.error(`[BackgroundEvaluator] Error executing screener ${screener.screener_id}:`, error.message);
      return [];
    }
  }

  /**
   * Cleanup expired alerts
   * @private
   */
  async cleanupExpiredAlerts() {
    console.log("[BackgroundEvaluator] Cleaning up expired alerts...");
    
    try {
      const deletedCount = await alertService.cleanupExpiredAlerts();
      console.log(`[BackgroundEvaluator] Cleaned up ${deletedCount} expired alerts`);
      return deletedCount;
    } catch (error) {
      console.error("[BackgroundEvaluator] Error cleaning up alerts:", error);
      // Don't throw - this is not critical
      return 0;
    }
  }

  /**
   * Get scheduler statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      intervalMs: this.evaluationInterval,
      intervalMinutes: this.evaluationInterval / 60000
    };
  }

  /**
   * Run evaluation cycle manually (for testing/admin)
   * @returns {Promise<Object>} Cycle results
   */
  async runManual() {
    console.log("[BackgroundEvaluator] Running manual evaluation cycle");
    await this.runEvaluationCycle();
    return this.getStats();
  }
}

module.exports = new BackgroundEvaluatorService();
