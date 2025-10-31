import { useEffect, useRef, useCallback, useState } from 'react';
import { useLoading } from '../contexts/LoadingContext.jsx';

/**
 * Custom hook for managing loading indicators tied to specific operations
 * 
 * @param {Object} options - Hook options
 * @param {string} options.id - Unique identifier for this loading operation (optional)
 * @param {boolean} options.global - Whether this operation should affect global loading state
 * @returns {Object} Loading methods and state
 */
const useLoadingIndicator = ({ 
  id = undefined, 
  global = false 
} = {}) => {
  const { 
    setGlobalLoading, 
    registerLoadingOperation, 
    unregisterLoadingOperation,
    loadingOperations
  } = useLoading();
  // Local state to reflect loading immediately in the hook's returned value
  const [localLoading, setLocalLoading] = useState(false);
  
  // Generate a unique ID if none provided
  const loadingId = useRef(id || `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // State tracking for component unmounting
  const isUnmounted = useRef(false);
  
  // Function to start the loading indicator
  const startLoading = useCallback(() => {
    if (isUnmounted.current) return;
    setLocalLoading(true);
    
    if (global) {
      setGlobalLoading(true);
    }
    
    registerLoadingOperation(loadingId.current, true);
  }, [global, setGlobalLoading, registerLoadingOperation]);
  
  // Function to stop the loading indicator
  const stopLoading = useCallback(() => {
    if (isUnmounted.current) return;
    setLocalLoading(false);
    
    if (global) {
      setGlobalLoading(false);
    }
    
    unregisterLoadingOperation(loadingId.current);
  }, [global, setGlobalLoading, unregisterLoadingOperation]);
  
  // Helper to wrap an async function with loading indicators
  const wrapPromise = useCallback(async (promise) => {
    if (!promise || typeof promise.then !== 'function') {
      console.warn('wrapPromise expected a Promise but received:', promise);
      return promise;
    }
    
  startLoading();
    
    try {
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
      unregisterLoadingOperation(loadingId.current);
    };
  }, [unregisterLoadingOperation]);
  
  return {
    isLoading: localLoading || !!loadingOperations[loadingId.current],
    startLoading,
    stopLoading,
    wrapPromise,
    loadingId: loadingId.current
  };
};

export default useLoadingIndicator;