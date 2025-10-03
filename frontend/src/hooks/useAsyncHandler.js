import { useState, useCallback, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';
import useRetry from './useRetry';
import { useNetworkStatus } from './useNetworkStatus';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

/**
 * A unified hook that combines error handling, retry logic, and network status
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} Combined state and functions
 */
export const useAsyncHandler = (apiFunction, options = {}) => {
  const {
    // General options
    initialData = null,
    initialLoading = false,
    dependencies = [],
    executeImmediately = false,
    cacheKey = null,
    
    // Toast options
    showToasts = true,
    toastMessages = {},
    
    // Retry options
    retryOptions = {},
    
    // Cache options
    cacheTime = 5 * 60 * 1000, // 5 minutes
    
    // Event callbacks
    onSuccess,
    onError,
    onOffline,
    
    // Network status options
    networkOptions = {},
  } = options;

  // Base state
  const [data, setData] = useState(initialData);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState(null);
  
  // Custom hooks for different functionalities
  const { error, clearError } = useErrorHandler();
  const { isOnline, checkConnection } = useNetworkStatus(networkOptions);
  
  // Setup retry handler
  const {
    execute,
    retry,
    retryCount,
    isRetrying,
    isLoading: isRetryLoading,
  } = useRetry(apiFunction, {
    ...retryOptions,
    onSuccess: (result) => {
      if (retryOptions.onSuccess) retryOptions.onSuccess(result);
      
      // Additional success handling
      setData(result);
      setTimestamp(Date.now());
      setIsEmpty(Array.isArray(result) ? result.length === 0 : !result);
      
      // Show success toast if retried and succeeded
      if (showToasts && retryCount > 0 && toastMessages.retrySuccess) {
        showSuccess(toastMessages.retrySuccess);
      }
      
      // Call parent onSuccess if provided
      if (onSuccess) onSuccess(result);
      
      // Cache the result if needed
      if (cacheKey) {
        try {
          sessionStorage.setItem(
            `async_cache_${cacheKey}`, 
            JSON.stringify({
              data: result,
              timestamp: Date.now()
            })
          );
        } catch (e) {
          console.warn('Failed to cache result:', e);
        }
      }
    },
    onError: (err, retryInfo) => {
      if (retryOptions.onError) retryOptions.onError(err, retryInfo);
      
      // Show toast based on retry status
      if (showToasts) {
        if (retryInfo.willRetry) {
          if (toastMessages.retrying) {
            showInfo(`${toastMessages.retrying} (${retryInfo.attempt}/${retryOptions.maxRetries || 3})`);
          }
        } else if (!isOnline && onOffline) {
          // If we're offline and not retrying, call the offline handler
          onOffline(err);
        } else if (onError) {
          // Call parent onError if provided and not retrying
          onError(err);
        }
      }
    }
  });

  /**
   * Check and load cached data if available
   */
  const loadFromCache = useCallback(() => {
    if (!cacheKey) return false;
    
    try {
      const cached = sessionStorage.getItem(`async_cache_${cacheKey}`);
      if (cached) {
        const { data: cachedData, timestamp: cachedTime } = JSON.parse(cached);
        const age = Date.now() - cachedTime;
        
        if (age < cacheTime) {
          setData(cachedData);
          setTimestamp(cachedTime);
          setIsEmpty(Array.isArray(cachedData) ? cachedData.length === 0 : !cachedData);
          return true;
        } else {
          // Clear expired cache
          sessionStorage.removeItem(`async_cache_${cacheKey}`);
        }
      }
    } catch (e) {
      console.warn('Failed to load from cache:', e);
    }
    
    return false;
  }, [cacheKey, cacheTime]);

  /**
   * Execute the API call with all handlers
   */
  const executeRequest = useCallback(async (...args) => {
    if (!isOnline) {
      if (showToasts && toastMessages.offline) {
        showWarning(toastMessages.offline);
      }
      
      // Try to load from cache when offline
      const hasCachedData = loadFromCache();
      
      if (!hasCachedData && onOffline) {
        onOffline(new Error('You are currently offline'));
      }
      
      // Return cached data or reject
      return hasCachedData ? data : Promise.reject(new Error('You are currently offline'));
    }
    
    // Check cache first if we have a cache key
    if (cacheKey) {
      const hasCachedData = loadFromCache();
      if (hasCachedData) {
        return data;
      }
    }
    
    // If not cached or cache expired, execute the request
    try {
      if (showToasts && toastMessages.loading) {
        showInfo(toastMessages.loading);
      }
      
      return await execute(...args);
    } catch (err) {
      if (showToasts && toastMessages.error && !isRetrying) {
        showError(toastMessages.error);
      }
      throw err;
    }
  }, [
    isOnline, 
    showToasts, 
    toastMessages, 
    loadFromCache, 
    onOffline, 
    cacheKey, 
    data, 
    execute, 
    isRetrying
  ]);

  // Execute on mount or when dependencies change if requested
  useEffect(() => {
    if (executeImmediately) {
      const hasCachedData = loadFromCache();
      
      if (!hasCachedData) {
        executeRequest();
      }
    }
  }, [executeImmediately, loadFromCache, executeRequest, ...dependencies]);

  return {
    data,
    isEmpty,
    timestamp,
    isLoading: isRetryLoading,
    isRetrying,
    retryCount,
    error,
    isOnline,
    execute: executeRequest,
    retry,
    clearError,
    checkConnection,
  };
};

export default useAsyncHandler;