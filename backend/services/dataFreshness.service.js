/**
 * Data Freshness Service
 * 
 * Calculates and returns data freshness metrics for UI display
 * - age_minutes: How old is the data?
 * - is_stale: Boolean flag if data is older than threshold
 * - last_updated: ISO timestamp
 * - warning: Human readable warning message
 * 
 * FINTECH INDUSTRY STANDARD: 
 * - Green (fresh): < 5 minutes
 * - Yellow (stale): 5-60 minutes  
 * - Red (very stale): > 60 minutes
 */

class DataFreshnessService {
  // Thresholds in minutes
  static FRESH_THRESHOLD = 5;        // Data < 5 min = green status
  static STALE_THRESHOLD = 60;       // Data 5-60 min = yellow warning
  static VERY_STALE_THRESHOLD = 1440; // Data > 24h = red alert

  /**
   * Calculate freshness metrics for any timestamp
   * @param {Date|string} lastUpdatedAt - Database updated_at timestamp
   * @returns {object} Freshness metrics object
   */
  static calculateFreshness(lastUpdatedAt) {
    if (!lastUpdatedAt) {
      return {
        age_minutes: null,
        is_fresh: false,
        is_stale: true,
        is_very_stale: true,
        status: 'UNKNOWN',
        last_updated: null,
        warning: 'Data timestamp missing - data quality unknown',
        delay_badge: '❌ No timestamp'
      };
    }

    const lastUpdate = new Date(lastUpdatedAt);
    const now = new Date();
    const ageMs = now - lastUpdate;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    let status = 'FRESH';
    let warning = '';
    let delay_badge = '✅ Fresh';

    if (ageMinutes < this.FRESH_THRESHOLD) {
      status = 'FRESH';
      warning = '';
      delay_badge = '✅ Real-time';
    } else if (ageMinutes < this.STALE_THRESHOLD) {
      status = 'STALE';
      warning = `⚠️ Data is ${ageMinutes} minutes old - use with caution for trading decisions`;
      delay_badge = `⏱️ Delayed ${ageMinutes}m`;
    } else if (ageHours < 24) {
      status = 'VERY_STALE';
      warning = `🔴 CRITICAL: Data is ${ageHours} hours old - do NOT trade on this data`;
      delay_badge = `🔴 ${ageHours}h old`;
    } else if (ageDays < 7) {
      status = 'VERY_STALE';
      warning = `🔴 CRITICAL: Data is ${ageDays} days old - do NOT use for trading`;
      delay_badge = `🔴 ${ageDays}d old`;
    } else {
      status = 'VERY_STALE';
      warning = `🔴 CRITICAL: Data is > 7 days old - API connection lost, using fallback data`;
      delay_badge = `🔴 >7d old`;
    }

    return {
      age_minutes: ageMinutes,
      age_hours: ageHours,
      age_days: ageDays,
      is_fresh: status === 'FRESH',
      is_stale: status === 'STALE',
      is_very_stale: status === 'VERY_STALE',
      status: status, // 'FRESH' | 'STALE' | 'VERY_STALE'
      last_updated: lastUpdate.toISOString(),
      warning: warning,
      delay_badge: delay_badge,
      color: status === 'FRESH' ? '#4CAF50' : status === 'STALE' ? '#FF9800' : '#F44336'
    };
  }

  /**
   * Add freshness metadata to API response
   * @param {object} data - API response data
   * @param {Date|string} lastUpdatedAt - Timestamp when data was last updated
   * @param {string} dataSource - Where data came from ('FINNHUB_API', 'DATABASE', 'FALLBACK', etc)
   * @returns {object} Response with metadata
   */
  static augmentResponse(data, lastUpdatedAt, dataSource = 'UNKNOWN') {
    const freshness = this.calculateFreshness(lastUpdatedAt);

    return {
      success: true,
      data: data,
      metadata: {
        freshness: freshness,
        source: dataSource,
        fetched_at: new Date().toISOString()
      }
    };
  }

  /**
   * Batch augment multiple stocks with freshness
   * @param {array} stocks - Array of stock objects
   * @param {Date|string} lastUpdatedAt - Common update timestamp
   * @param {string} dataSource - Data source identifier
   * @returns {object} Response with metadata
   */
  static augmentBatchResponse(stocks, lastUpdatedAt, dataSource = 'UNKNOWN') {
    const freshness = this.calculateFreshness(lastUpdatedAt);

    return {
      success: true,
      count: stocks.length,
      data: stocks,
      metadata: {
        freshness: freshness,
        source: dataSource,
        fetched_at: new Date().toISOString()
      }
    };
  }

  /**
   * Check if data is too stale for trading (> 60 minutes)
   * @param {Date|string} lastUpdatedAt 
   * @returns {boolean}
   */
  static isTooStaleForTrading(lastUpdatedAt) {
    const freshness = this.calculateFreshness(lastUpdatedAt);
    return freshness.status === 'VERY_STALE';
  }

  /**
   * Check if we should warn user
   * @param {Date|string} lastUpdatedAt 
   * @returns {boolean}
   */
  static shouldWarnUser(lastUpdatedAt) {
    const freshness = this.calculateFreshness(lastUpdatedAt);
    return freshness.warning !== '';
  }

  /**
   * Get human-readable time difference
   * @param {Date|string} date 
   * @returns {string} e.g. "5m ago", "2h ago", "Yesterday"
   */
  static getRelativeTime(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return target.toLocaleDateString();
  }
}

module.exports = DataFreshnessService;
