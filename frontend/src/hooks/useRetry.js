import { useState, useCallback, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { showWarning } from '../utils/toast';

/**
 * Custom hook for handling retries for API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} State and functions for retry mechanism
 */
export const useRetry = (apiFunction, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    retryableStatuses = [408, 500, 502, 503, 504],
    onSuccess,
    onError,
    onMaxRetries,
    retryOnNetworkError = true,
    autoRetry = false,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryDelay, setRetryDelay] = useState(initialDelay);
  const [data, setData] = useState(null);
  const { error, isLoading, handleAsync, clearError } = useErrorHandler();

  /**
   * Check if an error is retryable
   * @param {Error} err - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  const isRetryableError = useCallback((err) => {
    // Network errors
    if (retryOnNetworkError && err.message === 'Network Error') {
      return true;
    }

    // Specific HTTP status codes
    if (err.response && retryableStatuses.includes(err.response.status)) {
      return true;
    }

    // Allow custom retry logic via option
    if (options.shouldRetry && options.shouldRetry(err)) {
      return true;
    }

    return false;
  }, [retryOnNetworkError, retryableStatuses, options]);

  /**
   * Execute the API call with retry logic
   * @param {...any} args - Arguments to pass to the API function
   * @returns {Promise<any>} The API call result
   */
  const executeWithRetry = useCallback(async (...args) => {
    setIsRetrying(false);
    clearError();

    try {
      const result = await handleAsync(() => apiFunction(...args));
      setData(result);
      setRetryCount(0);
      setRetryDelay(initialDelay);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      if (isRetryableError(err) && retryCount < maxRetries) {
        setIsRetrying(true);

        // Calculate exponential backoff delay
        const nextDelay = retryDelay * (retryCount > 0 ? backoffFactor : 1);
        setRetryDelay(nextDelay);
        
        // Show retry warning
        showWarning(
          `Request failed. Retrying in ${(nextDelay / 1000).toFixed(1)} seconds... (${retryCount + 1}/${maxRetries})`, 
          { autoClose: nextDelay }
        );
        
        if (onError) onError(err, { willRetry: true, attempt: retryCount + 1 });
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            setRetryCount(prevCount => prevCount + 1);
            executeWithRetry(...args)
              .then(resolve)
              .catch(reject);
          }, nextDelay);
        });
      } else {
        setIsRetrying(false);
        if (retryCount >= maxRetries && onMaxRetries) {
          onMaxRetries(err, retryCount);
        }
        if (onError) onError(err, { willRetry: false, attempt: retryCount });
        throw err;
      }
    }
  }, [
    apiFunction, 
    retryCount, 
    maxRetries, 
    retryDelay, 
    initialDelay, 
    backoffFactor, 
    isRetryableError, 
    handleAsync, 
    clearError,
    onSuccess, 
    onError,
    onMaxRetries
  ]);

  // Auto-retry when the component mounts if enabled
  useEffect(() => {
    if (autoRetry && !isLoading && !data && !error) {
      executeWithRetry();
    }
  }, [autoRetry, executeWithRetry, isLoading, data, error]);

  /**
   * Manually retry the API call
   * @param {...any} args - Arguments to pass to the API function
   * @returns {Promise<any>} The API call result
   */
  const retry = useCallback((...args) => {
    setRetryCount(0);
    setRetryDelay(initialDelay);
    return executeWithRetry(...args);
  }, [executeWithRetry, initialDelay]);

  return {
    execute: executeWithRetry,
    retry,
    retryCount,
    isRetrying,
    isLoading,
    error,
    data,
    clearError,
  };
};

export default useRetry;