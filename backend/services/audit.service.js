/**
 * Audit Logging Service
 * Production-grade audit trail for all critical operations
 */

const pool = require("../database");

class AuditService {
  /**
   * Log an audit event
   * @param {Object} data - Audit data
   * @param {number} data.userId - User ID (optional)
   * @param {string} data.entityType - Entity type (alert, portfolio, screener, evaluation)
   * @param {number} data.entityId - Entity ID (optional)
   * @param {string} data.action - Action performed
   * @param {string} data.description - Human-readable description
   * @param {Object} data.metadata - Additional metadata as JSON
   * @param {string} data.ipAddress - IP address (optional)
   * @param {string} data.userAgent - User agent (optional)
   * @param {Object} client - Database client for transactions (optional)
   * @returns {Promise<Object>} Audit log entry
   */
  async log(data, client = null) {
    const {
      userId = null,
      entityType,
      entityId = null,
      action,
      description = '',
      metadata = {},
      ipAddress = null,
      userAgent = null
    } = data;

    // Validation
    if (!entityType || !action) {
      throw new Error("entityType and action are required for audit logging");
    }

    const query = `
      INSERT INTO audit_logs 
        (user_id, entity_type, entity_id, action, description, metadata, ip_address, user_agent) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;

    const values = [
      userId,
      entityType,
      entityId,
      action,
      description,
      JSON.stringify(metadata),
      ipAddress,
      userAgent
    ];

    try {
      const dbClient = client || pool;
      const result = await dbClient.query(query, values);
      
      // Log to console for monitoring
      console.log(`[AUDIT] ${action.toUpperCase()} ${entityType} by user ${userId || 'system'}`);
      
      return result.rows[0];
    } catch (error) {
      console.error("Audit logging error:", error);
      // Don't throw - audit logging should not break main operations
      return null;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Audit logs
   */
  async getUserLogs(userId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error("Get user logs error:", error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   * @param {string} entityType - Entity type
   * @param {number} entityId - Entity ID
   * @returns {Promise<Array>} Audit logs
   */
  async getEntityLogs(entityType, entityId) {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_logs 
         WHERE entity_type = $1 AND entity_id = $2 
         ORDER BY created_at DESC`,
        [entityType, entityId]
      );

      return result.rows;
    } catch (error) {
      console.error("Get entity logs error:", error);
      throw error;
    }
  }

  /**
   * Get recent audit logs across all entities
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} Audit logs
   */
  async getRecentLogs(limit = 50) {
    try {
      const result = await pool.query(
        `SELECT 
          al.*,
          u.email as user_email,
          u.name as user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC 
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error("Get recent logs error:", error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Statistics
   */
  async getStats(days = 7) {
    try {
      const result = await pool.query(
        `SELECT 
          entity_type,
          action,
          COUNT(*) as count
         FROM audit_logs
         WHERE created_at > NOW() - INTERVAL '${days} days'
         GROUP BY entity_type, action
         ORDER BY count DESC`
      );

      return {
        period_days: days,
        actions: result.rows,
        total: result.rows.reduce((sum, r) => sum + parseInt(r.count), 0)
      };
    } catch (error) {
      console.error("Get audit stats error:", error);
      throw error;
    }
  }
}

module.exports = new AuditService();
