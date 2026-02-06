/**
 * Saved Screeners Service
 * Manage user-saved stock screening queries
 */

const pool = require("../database");
const auditService = require("./audit.service");

class SavedScreenersService {
  /**
   * Save a new screener for a user
   * @param {Object} screenerData - Screener configuration
   * @returns {Promise<Object>} Saved screener
   */
  async saveScreener(screenerData) {
    const {
      userId,
      name,
      description = null,
      dslQuery,
      notificationEnabled = true
    } = screenerData;

    // Validation
    if (!userId || !name || !dslQuery) {
      throw new Error("Missing required fields: userId, name, dslQuery");
    }

    if (typeof dslQuery !== 'object') {
      throw new Error("dslQuery must be a valid object");
    }

    try {
      const result = await pool.query(
        `INSERT INTO saved_screeners 
          (user_id, name, description, dsl_query, notification_enabled)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, name, description, JSON.stringify(dslQuery), notificationEnabled]
      );

      const screener = result.rows[0];

      // Audit log
      await auditService.log({
        userId,
        entityType: 'screener',
        entityId: screener.id,
        action: 'create',
        description: `Saved screener: ${name}`,
        metadata: { notification_enabled: notificationEnabled }
      });

      console.log(`[Screeners] Saved screener ${screener.id} for user ${userId}: ${name}`);

      // PostgreSQL returns JSON columns as objects already, no need to parse
      return {
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      };
    } catch (error) {
      console.error("Save screener error:", error);
      throw error;
    }
  }

  /**
   * Get all saved screeners for a user
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - Return only active screeners
   * @returns {Promise<Array>} Saved screeners
   */
  async getUserScreeners(userId, activeOnly = true) {
    try {
      let query = `
        SELECT * FROM saved_screeners
        WHERE user_id = $1
      `;

      if (activeOnly) {
        query += ' AND active = true';
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, [userId]);

      return result.rows.map(screener => ({
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      }));
    } catch (error) {
      console.error("Get user screeners error:", error);
      throw error;
    }
  }

  /**
   * Get a specific screener by ID
   * @param {number} screenerId - Screener ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Screener details
   */
  async getScreenerById(screenerId, userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM saved_screeners
         WHERE id = $1 AND user_id = $2`,
        [screenerId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Screener not found or unauthorized");
      }

      const screener = result.rows[0];
      return {
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      };
    } catch (error) {
      console.error("Get screener by ID error:", error);
      throw error;
    }
  }

  /**
   * Update a saved screener
   * @param {number} screenerId - Screener ID
   * @param {number} userId - User ID (for security)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated screener
   */
  async updateScreener(screenerId, userId, updates) {
    const {
      name,
      description,
      dslQuery,
      notificationEnabled,
      active
    } = updates;

    try {
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (dslQuery !== undefined) {
        updateFields.push(`dsl_query = $${paramCount++}`);
        values.push(JSON.stringify(dslQuery));
      }

      if (notificationEnabled !== undefined) {
        updateFields.push(`notification_enabled = $${paramCount++}`);
        values.push(notificationEnabled);
      }

      if (active !== undefined) {
        updateFields.push(`active = $${paramCount++}`);
        values.push(active);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length === 1) {
        throw new Error("No fields to update");
      }

      values.push(screenerId, userId);

      const result = await pool.query(
        `UPDATE saved_screeners 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount++} AND user_id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error("Screener not found or unauthorized");
      }

      const screener = result.rows[0];

      // Audit log
      await auditService.log({
        userId,
        entityType: 'screener',
        entityId: screenerId,
        action: 'update',
        description: `Updated screener: ${screener.name}`,
        metadata: updates
      });

      return {
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      };
    } catch (error) {
      console.error("Update screener error:", error);
      throw error;
    }
  }

  /**
   * Delete a saved screener
   * @param {number} screenerId - Screener ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteScreener(screenerId, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM saved_screeners
         WHERE id = $1 AND user_id = $2
         RETURNING name`,
        [screenerId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Screener not found or unauthorized");
      }

      // Audit log
      await auditService.log({
        userId,
        entityType: 'screener',
        entityId: screenerId,
        action: 'delete',
        description: `Deleted screener: ${result.rows[0].name}`
      });

      return {
        success: true,
        message: `Screener "${result.rows[0].name}" deleted successfully`
      };
    } catch (error) {
      console.error("Delete screener error:", error);
      throw error;
    }
  }

  /**
   * Toggle notification for a screener
   * @param {number} screenerId - Screener ID
   * @param {number} userId - User ID
   * @param {boolean} enabled - Notification enabled state
   * @returns {Promise<Object>} Updated screener
   */
  async toggleNotifications(screenerId, userId, enabled) {
    try {
      const result = await pool.query(
        `UPDATE saved_screeners
         SET notification_enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [enabled, screenerId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Screener not found or unauthorized");
      }

      const screener = result.rows[0];

      await auditService.log({
        userId,
        entityType: 'screener',
        entityId: screenerId,
        action: 'update',
        description: `Notifications ${enabled ? 'enabled' : 'disabled'} for screener: ${screener.name}`
      });

      return {
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      };
    } catch (error) {
      console.error("Toggle notifications error:", error);
      throw error;
    }
  }

  /**
   * Get all active screeners for background evaluation
   * @returns {Promise<Array>} Active screeners with user info
   */
  async getActiveScreenersForEvaluation() {
    try {
      const result = await pool.query(
        `SELECT 
          s.*,
          u.email,
          u.name as user_name
         FROM saved_screeners s
         INNER JOIN users u ON s.user_id = u.id
         WHERE s.active = true AND s.notification_enabled = true
         ORDER BY s.updated_at ASC`
      );

      return result.rows.map(screener => ({
        ...screener,
        dsl_query: typeof screener.dsl_query === 'string' 
          ? JSON.parse(screener.dsl_query) 
          : screener.dsl_query
      }));
    } catch (error) {
      console.error("Get active screeners for evaluation error:", error);
      throw error;
    }
  }

  /**
   * Get screener statistics for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getScreenerStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_screeners,
          COUNT(*) FILTER (WHERE active = true) as active_screeners,
          COUNT(*) FILTER (WHERE notification_enabled = true) as with_notifications
         FROM saved_screeners
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Get screener stats error:", error);
      throw error;
    }
  }
}

module.exports = new SavedScreenersService();
