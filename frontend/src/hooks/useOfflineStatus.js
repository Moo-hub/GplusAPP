import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook for detecting online/offline status and showing appropriate notifications
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.showToasts - Whether to show toast notifications on status changes
 * @param {number} options.checkInterval - Interval in ms to actively check connection (0 to disable)
 * @param {string} options.endpoint - URL to ping for active connection checks
 * @returns {Object} Online status data and methods
 */
export const useOfflineStatus = ({
  showToasts = true,
  checkInterval = 0,
  endpoint = '/api/health'
} = {}) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const { addToast } = useToast();
  const isOfflineRef = useRef(isOffline);
  const initialCheckRef = useRef(false);

  // Handler for when browser goes offline
  const handleOffline = useCallback(() => {
    setIsOffline(true);
    if (showToasts) {
      addToast({
        id: 'connection-offline',
        type: 'error',
        title: 'You are offline',
        message: 'Check your internet connection and try again.',
        autoClose: false,
        icon: 'wifi-off'
      });
    }
  }, [showToasts, addToast]);

  // Handler for when browser goes online
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    if (showToasts) {
      addToast({
        id: 'connection-online',
        type: 'success',
        title: 'You are back online',
        message: 'Your internet connection has been restored.',
        autoClose: true,
        duration: 5000,
        icon: 'wifi'
      });
    }
  }, [showToasts, addToast]);

  // Active connection check function
  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return false;
    }

    setIsCheckingConnection(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      
      clearTimeout(timeoutId);

      // no-op: removed test debug logs
      
      if (response.ok) {
        if (isOfflineRef.current) {
          handleOnline();
        }
        return true;
      } else {
        if (!isOfflineRef.current) {
          handleOffline();
        }
        return false;
      }
    } catch (error) {
      if (!isOfflineRef.current) {
        handleOffline();
      }
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, [endpoint, handleOffline, handleOnline]);

  // Register event listeners on mount
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount only (avoid re-triggering when isOffline updates)
    if (navigator.onLine && isOffline && !initialCheckRef.current) {
      initialCheckRef.current = true;
      checkConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // Intentionally omit `isOffline` from dependencies to avoid repeated
    // invocations of `checkConnection` when `isOffline` flips. We still
    // include handlers and checkConnection so the listeners are current.
  }, [handleOnline, handleOffline, checkConnection]);

  // Keep a ref copy of isOffline to avoid capturing it in checkConnection
  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  // Setup active connection check if interval is set
  useEffect(() => {
    if (!checkInterval) return;
    
    const intervalId = setInterval(checkConnection, checkInterval);
    
    return () => clearInterval(intervalId);
  }, [checkInterval, checkConnection]);

  return {
    isOffline,
    isOnline: !isOffline,
    checkConnection,
    isCheckingConnection
  };
};

export default useOfflineStatus;