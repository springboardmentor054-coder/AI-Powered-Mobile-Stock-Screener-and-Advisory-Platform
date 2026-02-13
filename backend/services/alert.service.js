/**
 * Alert Service
 * Production-grade alert creation and management with cooldown logic
 */

const pool = require("../database");
const auditService = require("./audit.service");
const finnhubService = require("./finnhub.service");

class AlertService {
  constructor() {
    // Cooldown periods in minutes
    this.cooldownPeriods = {
      'pe_change': 60, // 1 hour
      'revenue_growth': 120, // 2 hours
      'price_target': 30, // 30 minutes
      'earnings_update': 240, // 4 hours
      'default': 60 // 1 hour default
    };
  }

  /**
   * Get user alert preferences
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const result = await pool.query(
        `SELECT alert_preferences 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getDefaultPreferences();
      }

      return result.rows[0].alert_preferences || this.getDefaultPreferences();
    } catch (error) {
      console.error("Get user preferences error:", error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default alert preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      enabled: true,
      allowedTypes: [
        'pe_change',
        'revenue_growth',
        'price_target',
        'earnings_update',
        'VALUATION',
        'EVENT',
        'PORTFOLIO'
      ],
      severityThreshold: 'low' // Receive all severities by default
    };
  }

  /**
   * Check if user preferences allow this alert type
   * @param {Object} userPreferences - User preferences object
   * @param {string} alertType - Alert type to check
   * @returns {boolean} Whether alert type is allowed
   */
  allows(userPreferences, alertType) {
    if (!userPreferences || !userPreferences.enabled) {
      return false;
    }

    if (!userPreferences.allowedTypes || userPreferences.allowedTypes.length === 0) {
      return true; // If no restrictions, allow all
    }

    return userPreferences.allowedTypes.includes(alertType);
  }

  /**
   * Suppress an alert (mark as inactive without delivering)
   * @param {Object} alert - Alert object
   * @param {string} reason - Suppression reason
   * @returns {Promise<Object>} Suppression result
   */
  async suppressAlert(alert, reason = 'user_preferences') {
    try {
      await pool.query(
        `UPDATE alerts 
         SET active = false,
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{suppression}',
               $1::jsonb
             )
         WHERE id = $2`,
        [
          JSON.stringify({
            suppressed: true,
            reason: reason,
            suppressedAt: new Date().toISOString()
          }),
          alert.id
        ]
      );

      console.log(`[Alert] Suppressed alert ${alert.id}: ${reason}`);

      return {
        suppressed: true,
        reason,
        alertId: alert.id
      };
    } catch (error) {
      console.error("Suppress alert error:", error);
      throw error;
    }
  }

  /**
   * Create an alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Created alert
   */
  async createAlert(alertData) {
    const {
      userId,
      companyId,
      alertType,
      severity,
      title,
      description,
      previousValue = null,
      currentValue = null,
      metadata = {}
    } = alertData;

    // Validation
    if (!userId || !companyId || !alertType || !severity || !title || !description) {
      throw new Error("Missing required alert fields");
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check cooldown
      const cooldownMinutes = this.cooldownPeriods[alertType] || this.cooldownPeriods.default;
      const cooldownCheck = await client.query(
        `SELECT id, triggered_at 
         FROM alerts 
         WHERE user_id = $1 
           AND company_id = $2 
           AND alert_type = $3 
           AND triggered_at > NOW() - INTERVAL '${cooldownMinutes} minutes'
         ORDER BY triggered_at DESC
         LIMIT 1`,
        [userId, companyId, alertType]
      );

      if (cooldownCheck.rows.length > 0) {
        console.log(`[Alert] Cooldown active for ${alertType} - suppressing duplicate alert`);
        await client.query('ROLLBACK');
        return {
          suppressed: true,
          reason: 'cooldown_active',
          cooldown_until: new Date(cooldownCheck.rows[0].triggered_at.getTime() + cooldownMinutes * 60000)
        };
      }

      // Calculate expiration (alerts expire after 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create alert
      const result = await client.query(
        `INSERT INTO alerts 
          (user_id, company_id, alert_type, severity, title, description, 
           previous_value, current_value, metadata, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          userId,
          companyId,
          alertType,
          severity,
          title,
          description,
          previousValue ? JSON.stringify(previousValue) : null,
          currentValue ? JSON.stringify(currentValue) : null,
          JSON.stringify(metadata),
          expiresAt
        ]
      );

      const alert = result.rows[0];

      // Audit log
      await auditService.log({
        userId,
        entityType: 'alert',
        entityId: alert.id,
        action: 'trigger',
        description: `Alert triggered: ${title}`,
        metadata: { alert_type: alertType, severity, company_id: companyId }
      }, client);

      await client.query('COMMIT');

      console.log(`[Alert] Created ${severity} alert for user ${userId}: ${title}`);

      return {
        ...alert,
        suppressed: false
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Alert creation error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's active alerts
   * @param {number} userId - User ID
   * @param {boolean} unreadOnly - Return only unread alerts
   * @returns {Promise<Array>} Alerts
   */
  async getUserAlerts(userId, unreadOnly = false) {
    try {
      let query = `
        SELECT 
          a.*,
          c.symbol,
          c.name as company_name,
          c.sector
        FROM alerts a
        INNER JOIN companies c ON a.company_id = c.id
        WHERE a.user_id = $1 
          AND a.active = true 
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
      `;

      if (unreadOnly) {
        query += ' AND a.read = false';
      }

      query += ' ORDER BY a.triggered_at DESC';

      const result = await pool.query(query, [userId]);
      const alerts = result.rows;

      // Get unique symbols from alerts
      const symbols = [...new Set(alerts.map(a => a.symbol))];

      // Fetch current prices from Finnhub
      let priceMap = new Map();
      if (symbols.length > 0) {
        try {
          const priceData = await finnhubService.getQuotes(symbols);
          // Normalize symbol matching (strip .NS/.BO suffix)
          priceMap = new Map(priceData.map(p => {
            const baseSymbol = p.symbol.replace(/\.(NS|BO)$/, '');
            return [baseSymbol, p];
          }));
        } catch (error) {
          console.error("Failed to fetch prices for alerts:", error.message);
        }
      }

      // Enrich alerts with current prices and extract JSONB values
      const enrichedAlerts = alerts.map(alert => {
        const priceInfo = priceMap.get(alert.symbol);
        const currentPrice = priceInfo?.current_price || null;

        // Extract target price ONLY for price-related alerts
        let targetPrice = null;
        const priceAlertTypes = ['price_target', 'price_above', 'price_below', 'stop_loss'];
        if (priceAlertTypes.some(type => alert.alert_type.includes(type))) {
          if (alert.metadata && typeof alert.metadata === 'object') {
            targetPrice = alert.metadata.target_price || alert.metadata.threshold || null;
          }
          if (!targetPrice && alert.previous_value && typeof alert.previous_value === 'object') {
            targetPrice = alert.previous_value.price || alert.previous_value.value || null;
          }
          if (!targetPrice && alert.current_value && typeof alert.current_value === 'object') {
            targetPrice = alert.current_value.price || alert.current_value.value || null;
          }
        }

        // Calculate triggered status based on alert type
        let isTriggered = false;
        let status = 'monitoring';
        
        if (alert.alert_type.includes('price') && currentPrice && targetPrice) {
          // Price-based alerts
          if (alert.alert_type.includes('above') || alert.alert_type.includes('high')) {
            isTriggered = currentPrice >= targetPrice;
          } else if (alert.alert_type.includes('below') || alert.alert_type.includes('low')) {
            isTriggered = currentPrice <= targetPrice;
          } else {
            const change = ((currentPrice - targetPrice) / targetPrice) * 100;
            isTriggered = Math.abs(change) >= 5; // 5% threshold
          }
        } else if (alert.alert_type.includes('revenue_growth')) {
          // Revenue growth alerts - check if threshold met
          const threshold = alert.metadata?.threshold || 10;
          const revenueGrowth = alert.current_value?.revenue_growth || alert.metadata?.revenue_growth || 0;
          isTriggered = revenueGrowth >= threshold;
        } else if (alert.alert_type.includes('pe_ratio')) {
          // PE ratio change alerts - check percentage change
          const changePercent = parseFloat(alert.metadata?.change_percent) || 0;
          isTriggered = Math.abs(changePercent) >= 5; // 5% threshold
        } else {
          // Default: already triggered
          isTriggered = true;
        }
        
        status = isTriggered ? 'triggered' : 'monitoring';

        return {
          ...alert,
          current_price: currentPrice,
          target_price: targetPrice,
          is_triggered: isTriggered,
          status: status,
          price_change: priceInfo?.change_percent || null
        };
      });

      return enrichedAlerts;
    } catch (error) {
      console.error("Get user alerts error:", error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   * @param {number} alertId - Alert ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Updated alert
   */
  async markAsRead(alertId, userId) {
    try {
      const result = await pool.query(
        `UPDATE alerts 
         SET read = true 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [alertId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Alert not found or unauthorized");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Mark alert as read error:", error);
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   * @param {number} alertId - Alert ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Updated alert
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const result = await pool.query(
        `UPDATE alerts 
         SET acknowledged = true,
             acknowledged_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [alertId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Alert not found or unauthorized");
      }

      await auditService.log({
        userId,
        entityType: 'alert',
        entityId: alertId,
        action: 'acknowledge',
        description: `Alert acknowledged: ${result.rows[0].title}`,
        metadata: { alert_type: result.rows[0].alert_type }
      });

      console.log(`[Alert] Alert ${alertId} acknowledged by user ${userId}`);

      return result.rows[0];
    } catch (error) {
      console.error("Acknowledge alert error:", error);
      throw error;
    }
  }

  /**
   * Mark alert as delivered
   * @param {number} alertId - Alert ID
   * @returns {Promise<Object>} Updated alert
   */
  async markAsDelivered(alertId) {
    try {
      const result = await pool.query(
        `UPDATE alerts 
         SET delivered = true, delivered_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [alertId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Mark alert as delivered error:", error);
      throw error;
    }
  }

  /**
   * Get pending (undelivered) alerts for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Pending alerts
   */
  async getPendingAlerts(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          a.*,
          c.symbol,
          c.name as company_name,
          c.sector
        FROM alerts a
        INNER JOIN companies c ON a.company_id = c.id
        WHERE a.user_id = $1 
          AND a.active = true 
          AND a.delivered = false
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
        ORDER BY 
          CASE a.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          a.triggered_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error("Get pending alerts error:", error);
      throw error;
    }
  }

  /**
   * Mark multiple alerts as delivered
   * @param {Array} alerts - Array of alert objects
   * @returns {Promise<number>} Number of alerts marked as delivered
   */
  async markAlertsAsDelivered(alerts) {
    if (!alerts || alerts.length === 0) {
      return 0;
    }

    try {
      const alertIds = alerts.map(alert => alert.id);
      const result = await pool.query(
        `UPDATE alerts 
         SET delivered = true, delivered_at = NOW() 
         WHERE id = ANY($1) 
         RETURNING id`,
        [alertIds]
      );

      console.log(`[Alert] Marked ${result.rows.length} alerts as delivered`);
      return result.rows.length;
    } catch (error) {
      console.error("Mark alerts as delivered error:", error);
      throw error;
    }
  }

  /**
   * Send batch notification to user
   * @param {number} userId - User ID
   * @param {Array} alerts - Array of alerts
   * @returns {Promise<Object>} Notification result
   */
  async sendBatchNotification(userId, alerts) {
    try {
      if (!alerts || alerts.length === 0) {
        return { sent: false, reason: 'no_alerts' };
      }

      // Group alerts by severity
      const groupedBySeverity = alerts.reduce((acc, alert) => {
        const severity = alert.severity || 'low';
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(alert);
        return acc;
      }, {});

      // Prepare notification payload
      const notification = {
        userId,
        type: 'batch_alert',
        timestamp: new Date().toISOString(),
        summary: {
          total: alerts.length,
          critical: groupedBySeverity.critical?.length || 0,
          high: groupedBySeverity.high?.length || 0,
          medium: groupedBySeverity.medium?.length || 0,
          low: groupedBySeverity.low?.length || 0
        },
        alerts: alerts.map(alert => ({
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          company: alert.company_name,
          symbol: alert.symbol,
          triggeredAt: alert.triggered_at
        }))
      };

      // Log notification (in production, integrate with notification service)
      console.log(`[Alert] Sending batch notification to user ${userId}:`, notification.summary);

      // Audit the batch notification
      await auditService.log({
        userId,
        entityType: 'notification',
        entityId: null,
        action: 'send_batch',
        description: `Batch notification sent with ${alerts.length} alerts`,
        metadata: notification.summary
      });

      return {
        sent: true,
        notification
      };
    } catch (error) {
      console.error("Send batch notification error:", error);
      throw error;
    }
  }

  /**
   * Deliver alert immediately based on severity
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Delivery result
   */
  async deliverNow(alert) {
    try {
      console.log(`[Alert] Delivering HIGH/CRITICAL alert immediately: ${alert.title}`);

      // Mark as delivered
      await this.markAsDelivered(alert.id);

      // Send immediate notification (in production, integrate with push notification service)
      const notification = {
        type: 'immediate_alert',
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        company: alert.company_name || 'N/A',
        symbol: alert.symbol || 'N/A',
        triggeredAt: alert.triggered_at
      };

      console.log(`[Alert] Immediate notification sent:`, notification);

      return {
        delivered: true,
        deliveryType: 'immediate',
        notification
      };
    } catch (error) {
      console.error("Deliver now error:", error);
      throw error;
    }
  }

  /**
   * Schedule alert for later delivery (daily digest)
   * @param {Object} alert - Alert object
   * @param {string} scheduleType - Schedule type (DAILY_DIGEST, WEEKLY_DIGEST, etc.)
   * @returns {Promise<Object>} Schedule result
   */
  async scheduleForLater(alert, scheduleType = 'DAILY_DIGEST') {
    try {
      console.log(`[Alert] Scheduling alert for ${scheduleType}: ${alert.title}`);

      // Update alert with schedule info
      await pool.query(
        `UPDATE alerts 
         SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{scheduled_delivery}',
           $1::jsonb
         )
         WHERE id = $2`,
        [
          JSON.stringify({
            type: scheduleType,
            scheduledAt: new Date().toISOString()
          }),
          alert.id
        ]
      );

      return {
        scheduled: true,
        scheduleType,
        alertId: alert.id
      };
    } catch (error) {
      console.error("Schedule for later error:", error);
      throw error;
    }
  }

  /**
   * Process alert delivery based on severity
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Processing result
   */
  async processAlertDelivery(alert) {
    try {
      const severity = (alert.severity || 'low').toUpperCase();

      if (severity === 'HIGH' || severity === 'CRITICAL') {
        return await this.deliverNow(alert);
      } else {
        return await this.scheduleForLater(alert, 'DAILY_DIGEST');
      }
    } catch (error) {
      console.error("Process alert delivery error:", error);
      throw error;
    }
  }

  /**
   * Process pending alerts for batch notification
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Processing result
   */
  async processPendingAlerts(userId) {
    try {
      const pendingAlerts = await this.getPendingAlerts(userId);

      if (pendingAlerts.length > 0) {
        await this.sendBatchNotification(userId, pendingAlerts);
        await this.markAlertsAsDelivered(pendingAlerts);

        return {
          processed: true,
          count: pendingAlerts.length
        };
      }

      return {
        processed: false,
        count: 0,
        reason: 'no_pending_alerts'
      };
    } catch (error) {
      console.error("Process pending alerts error:", error);
      throw error;
    }
  }

  /**
   * Dismiss/deactivate an alert
   * @param {number} alertId - Alert ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Updated alert
   */
  async dismissAlert(alertId, userId) {
    try {
      const result = await pool.query(
        `UPDATE alerts 
         SET active = false 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [alertId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Alert not found or unauthorized");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Dismiss alert error:", error);
      throw error;
    }
  }

  /**
   * Get alert statistics for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getAlertStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE read = false) as unread_count,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE severity = 'high') as high_count,
          COUNT(*) as total_active
         FROM alerts
         WHERE user_id = $1 
           AND active = true 
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Get alert stats error:", error);
      throw error;
    }
  }

  /**
   * Clean up expired alerts
   * @returns {Promise<number>} Number of deleted alerts
   */
  async cleanupExpiredAlerts() {
    try {
      const result = await pool.query(
        `DELETE FROM alerts 
         WHERE expires_at < NOW() 
         RETURNING id`
      );

      console.log(`[Alert] Cleaned up ${result.rows.length} expired alerts`);
      return result.rows.length;
    } catch (error) {
      console.error("Cleanup expired alerts error:", error);
      throw error;
    }
  }
  /**
   * Create digest grouped by alert type
   * @param {Array} alerts - Array of alerts
   * @returns {Object} Digest object grouped by type
   */
  createDigest(alerts) {
    try {
      const digest = {
        valuationChanges: alerts.filter(a => a.alert_type === 'VALUATION' || a.alert_type === 'pe_change'),
        eventUpdates: alerts.filter(a => a.alert_type === 'EVENT' || a.alert_type === 'earnings_update'),
        portfolioChanges: alerts.filter(a => a.alert_type === 'PORTFOLIO'),
        other: alerts.filter(a => 
          !['VALUATION', 'pe_change', 'EVENT', 'earnings_update', 'PORTFOLIO'].includes(a.alert_type)
        ),
        summary: {
          total: alerts.length,
          valuation: 0,
          event: 0,
          portfolio: 0,
          other: 0
        }
      };

      // Calculate summary counts
      digest.summary.valuation = digest.valuationChanges.length;
      digest.summary.event = digest.eventUpdates.length;
      digest.summary.portfolio = digest.portfolioChanges.length;
      digest.summary.other = digest.other.length;

      return digest;
    } catch (error) {
      console.error("Create digest error:", error);
      throw error;
    }
  }

  /**
   * Create and send daily digest for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Digest result
   */
  async createDailyDigest(userId) {
    try {
      // Get all undelivered alerts from the last 24 hours
      const result = await pool.query(
        `SELECT 
          a.*,
          c.symbol,
          c.name as company_name,
          c.sector
        FROM alerts a
        INNER JOIN companies c ON a.company_id = c.id
        WHERE a.user_id = $1 
          AND a.active = true 
          AND a.delivered = false
          AND a.triggered_at > NOW() - INTERVAL '24 hours'
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
        ORDER BY a.triggered_at DESC`,
        [userId]
      );

      const alerts = result.rows;

      if (alerts.length === 0) {
        return {
          sent: false,
          reason: 'no_alerts_in_period'
        };
      }

      // Create digest
      const digest = this.createDigest(alerts);

      // Log digest creation
      await auditService.log({
        userId,
        entityType: 'digest',
        entityId: null,
        action: 'create',
        description: `Daily digest created with ${alerts.length} alerts`,
        metadata: digest.summary
      });

      console.log(`[Alert] Daily digest created for user ${userId}:`, digest.summary);

      return {
        sent: true,
        digest,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Create daily digest error:", error);
      throw error;
    }
  }

  /**
   * Check user preferences and suppress if needed
   * @param {number} userId - User ID
   * @param {Object} alert - Alert object
   * @returns {Promise<boolean>} Whether alert should be suppressed
   */
  async checkAndSuppressIfNeeded(userId, alert) {
    try {
      const userPreferences = await this.getUserPreferences(userId);

      if (!this.allows(userPreferences, alert.alert_type)) {
        await this.suppressAlert(alert, 'user_preferences');
        return true;
      }

      return false;
    } catch (error) {
      console.error("Check and suppress error:", error);
      return false; // Don't suppress on error
    }
  }}

module.exports = new AlertService();
