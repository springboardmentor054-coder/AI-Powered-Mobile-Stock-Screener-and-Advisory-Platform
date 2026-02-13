/**
 * Professional Response Formatter
 * Standardized API response structure for enterprise applications
 */

/**
 * Format successful response
 * @param {*} data - Response data
 * @param {Object} metadata - Optional metadata
 * @param {string} message - Optional success message
 * @returns {Object} Formatted success response
 */
function success(data, metadata = {}, message = null) {
  const response = {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: data
  };

  if (message) {
    response.message = message;
  }

  if (Object.keys(metadata).length > 0) {
    response.metadata = metadata;
  }

  return response;
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Optional error details
 * @returns {Object} Formatted error response
 */
function error(message, code = 'ERROR', details = {}) {
  const response = {
    status: 'error',
    timestamp: new Date().toISOString(),
    error: {
      code: code,
      message: message
    }
  };

  if (Object.keys(details).length > 0) {
    response.error.details = details;
  }

  return response;
}

/**
 * Format validation error response
 * @param {Array} errors - Validation errors
 * @returns {Object} Formatted validation error response
 */
function validationError(errors) {
  return {
    status: 'error',
    timestamp: new Date().toISOString(),
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      validation_errors: errors
    }
  };
}

/**
 * Format paginated response
 * @param {Array} data - Response data
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {Object} metadata - Optional metadata
 * @returns {Object} Formatted paginated response
 */
function paginated(data, total, page, limit, metadata = {}) {
  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: data,
    pagination: {
      total: total,
      page: page,
      limit: limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_previous: page > 1
    },
    metadata: metadata
  };
}

/**
 * Format list response with count
 * @param {Array} items - List items
 * @param {Object} metadata - Optional metadata
 * @returns {Object} Formatted list response
 */
function list(items, metadata = {}) {
  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    count: items.length,
    data: items,
    metadata: metadata
  };
}

module.exports = {
  success,
  error,
  validationError,
  paginated,
  list
};
