import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * A custom hook for handling errors in async operations
 * 
 * @param {Object} options - Options for error handling
 * @param {boolean} options.showToast - Whether to show toast messages on error
 * @param {Function} options.onError - Custom error handler function
 * @returns {Object} - Error handling methods and state
 */
export const useErrorHandler = (options = {}) => {
  const { showToast = true, onError } = options;
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset the error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Safely handle async operations with error handling
  const handleAsync = useCallback(async (asyncFn, toastMessage) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setIsLoading(false);
      return result;
    } catch (err) {
      setIsLoading(false);
      setError(err);

      if (showToast && toastMessage) {
        toast.error(toastMessage);
      }

      if (onError) {
        onError(err);
      }

      // Log error in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error caught by useErrorHandler:', err);
      }

      throw err;
    }
  }, [showToast, onError]);

  return {
    error,
    clearError,
    handleAsync,
    isLoading
  };
};

/**
 * Handles API errors globally by type
 * @param {Error} error - The error object from API request
 * @returns {string} - Human readable error message
 */
export const getErrorMessage = (error) => {
  // Network errors
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle API error responses
  if (error.response) {
    const { status, data } = error.response;
    
    // Authentication errors
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    // Permission errors
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    // Not found errors
    if (status === 404) {
      return 'The requested resource was not found.';
    }

    // Validation errors
    if (status === 422 && data.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail.map(err => err.msg).join(', ');
      }
      return data.detail;
    }
    
    // Server errors
    if (status >= 500) {
      return 'Server error. Our team has been notified.';
    }

    // Other API errors with messages
    if (data && data.detail) {
      return data.detail;
    }
  }

  // Default fallback error message
  return 'An unexpected error occurred. Please try again later.';
};

export default useErrorHandler;