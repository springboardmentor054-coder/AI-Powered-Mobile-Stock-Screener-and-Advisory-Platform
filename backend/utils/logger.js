/**
 * Professional Logging Utility
 * Standardized logging format for production environments
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

const LOG_CATEGORIES = {
  DATABASE: 'DATABASE',
  CACHE: 'CACHE',
  API: 'API',
  SERVICE: 'SERVICE',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  FINNHUB: 'FINNHUB',
  LLM: 'LLM',
  SCHEMA: 'SCHEMA',
  SYSTEM: 'SYSTEM'
};

/**
 * Format timestamp for logs
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message with consistent structure
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 * @returns {string} Formatted log message
 */
function formatLog(level, category, message, metadata = {}) {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(metadata).length > 0 
    ? JSON.stringify(metadata) 
    : '';
  
  return `[${timestamp}] [${level}] [${category}] ${message}${metaStr ? ' ' + metaStr : ''}`;
}

/**
 * Log information message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 */
function info(category, message, metadata) {
  console.log(formatLog(LOG_LEVELS.INFO, category, message, metadata));
}

/**
 * Log warning message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 */
function warn(category, message, metadata) {
  console.warn(formatLog(LOG_LEVELS.WARN, category, message, metadata));
}

/**
 * Log error message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 */
function error(category, message, metadata) {
  console.error(formatLog(LOG_LEVELS.ERROR, category, message, metadata));
}

/**
 * Log debug message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 */
function debug(category, message, metadata) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLog(LOG_LEVELS.DEBUG, category, message, metadata));
  }
}

/**
 * Log success message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} metadata - Optional metadata
 */
function success(category, message, metadata) {
  console.log(formatLog(LOG_LEVELS.SUCCESS, category, message, metadata));
}

module.exports = {
  LOG_LEVELS,
  LOG_CATEGORIES,
  info,
  warn,
  error,
  debug,
  success,
  formatLog
};
