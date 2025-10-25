import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to monitor network status
 * @param {Object} options - Configuration options
 * @returns {Object} Network status and related utilities
 */
export const useNetworkStatus = (options = {}) => {
  const { 
    pingUrl = 'https://www.google.com/favicon.ico', 
    pingInterval = 30000,
    pingTimeout = 5000,
    pingOnInterval = true
  } = options;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [lastOnlineAt, setLastOnlineAt] = useState(
    navigator.onLine ? new Date() : null
  );

  /**
   * Actively checks if we have internet connection by loading a small resource
   * More reliable than the navigator.onLine API
   * @returns {Promise<boolean>} Whether the ping was successful
   */
  const checkConnection = useCallback(async () => {
    if (!pingUrl) return navigator.onLine;

    setIsChecking(true);
    
    try {
      // Prefer using apiClient in test environments so MSW intercepts the
      // connectivity check. Fallback to fetch for normal runtime.
      if (typeof globalThis !== 'undefined' && globalThis.__TEST__) {
        try {
          const { default: apiClient } = await import('../services/apiClient.js');
          // apiClient will await MSW readiness in its request interceptor.
          await apiClient.get(pingUrl + `?_=${Date.now()}`);
          setIsOnline(true);
          setLastChecked(new Date());
          setLastOnlineAt(new Date());
          setIsChecking(false);
          return true;
        } catch (e) {
          // fall through to fetch
        }
      }
      // Use a small image request with cache busting to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), pingTimeout);

  const response = await fetch(`http://localhost${pingUrl}?_=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If we reach this point, we're online
      setIsOnline(true);
      setLastChecked(new Date());
      setLastOnlineAt(new Date());
      setIsChecking(false);
      return true;
    } catch (error) {
      // Request failed or timed out
      const currentlyOnline = navigator.onLine;
      setIsOnline(currentlyOnline);
      setLastChecked(new Date());
      setIsChecking(false);
      
      // Only update lastOnlineAt if we're online
      if (currentlyOnline) {
        setLastOnlineAt(new Date());
      }
      
      return currentlyOnline;
    }
  }, [pingUrl, pingTimeout]);

  // Set up event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      
      // Double-check with an actual request to confirm
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      
      // Double-check with an actual request to confirm
      checkConnection();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Set up interval for periodic checks if requested
  useEffect(() => {
    if (pingOnInterval && pingInterval > 0) {
      const intervalId = setInterval(checkConnection, pingInterval);
      return () => clearInterval(intervalId);
    }
    return undefined;
  }, [checkConnection, pingInterval, pingOnInterval]);

  /**
   * Calculate time since last online
   * @returns {Object} Formatted time values since last online
   */
  const getTimeSinceOnline = useCallback(() => {
    if (!lastOnlineAt) return { minutes: 0, seconds: 0, formatted: '00:00' };
    
    const now = new Date();
  const diffMs = now.getTime() - (lastOnlineAt ? new Date(lastOnlineAt).getTime() : now.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    
    return {
      minutes,
      seconds,
      formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }, [lastOnlineAt]);

  return {
    isOnline,
    isChecking,
    lastChecked,
    lastOnlineAt,
    checkConnection,
    getTimeSinceOnline
  };
};

export default useNetworkStatus;