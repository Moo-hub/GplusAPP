/**
 * Common utilities for API operations
 */

/**
 * Standard error handler for API calls
 * 
 * @param {Error} error - The error object from axios
 * @param {string} message - A custom message to include in the error
 * @returns {Object} - Standardized error object
 */
export const handleApiError = (error, message = 'API request failed') => {
  try { const { logError } = require('../logError'); logError(`${message}: `, error); } catch (e) { try { require('../utils/logger').error(`${message}: `, error); } catch (er) {} }
  
  if (error.response) {
    // Server responded with non-2xx status
    return { 
      error: true, 
      message: `${message}: ${error.response.data.detail || error.response.statusText}`,
      status: error.response.status
    };
  } else if (error.request) {
    // Request was made but no response received
    return { 
      error: true, 
      message: `${message}: No response received from server`,
      networkError: true
    };
  } else {
    // Something happened in setting up the request
    return { 
      error: true, 
      message: `${message}: ${error.message}`,
      clientError: true
    };
  }
};