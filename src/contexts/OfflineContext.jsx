import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDB, addPendingRequest, getPendingRequests, markRequestSynced, deleteSyncedRequests } from '../utils/offlineStorage';

// Create context
const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  // Initialize IndexedDB
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        setIsDBInitialized(true);
        
        // Load pending requests
        const requests = await getPendingRequests();
        setPendingRequests(requests.filter(req => !req.synced));
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    
    initializeDB();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRequests();
      
      // Notify service worker about online status
      navigator.serviceWorker?.controller?.postMessage({
        type: 'ONLINE_STATUS_CHANGE',
        payload: true
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      // Notify service worker about offline status
      navigator.serviceWorker?.controller?.postMessage({
        type: 'ONLINE_STATUS_CHANGE',
        payload: false
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for service worker messages
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'CONNECTION_STATUS') {
        // Handle connection status updates from service worker
        console.log('Service worker connection status:', event.data.payload);
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [isDBInitialized]);

  // Function to sync pending requests when back online
  const syncPendingRequests = async () => {
    if (!isOnline || !isDBInitialized) return;
    
    try {
      const requests = await getPendingRequests();
      const pendingToSync = requests.filter(req => !req.synced);
      
      if (pendingToSync.length === 0) return;
      
      // Try to sync all pending requests
      for (const request of pendingToSync) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(request.body)
          });
          
          if (response.ok) {
            await markRequestSynced(request.id);
          } else {
            console.error('Failed to sync request:', request, response);
          }
        } catch (error) {
          console.error('Error syncing request:', request, error);
        }
      }
      
      // Clean up synced requests
      await deleteSyncedRequests();
      
      // Update pending requests count
      const updatedRequests = await getPendingRequests();
      setPendingRequests(updatedRequests.filter(req => !req.synced));
      
      // Trigger a custom event that components can listen for
      window.dispatchEvent(new CustomEvent('offlineSyncComplete'));
    } catch (error) {
      console.error('Error syncing pending requests:', error);
    }
  };

  // Function to queue a request for offline sync
  const queueRequest = async (requestData) => {
    if (!isDBInitialized) return;
    
    try {
      await addPendingRequest(requestData);
      
      // Update pending requests count
      const requests = await getPendingRequests();
      setPendingRequests(requests.filter(req => !req.synced));
      
      return { success: true };
    } catch (error) {
      console.error('Error queuing request:', error);
      return { success: false, error };
    }
  };

  // Function to manually toggle offline mode for testing
  const toggleOfflineMode = () => {
    setOfflineMode(!offlineMode);
  };
  
  // Check if app should operate in offline mode
  const isAppOffline = !isOnline || offlineMode;

  const value = {
    isOnline,
    isAppOffline,
    pendingRequests,
    offlineMode,
    toggleOfflineMode,
    queueRequest,
    syncPendingRequests
  };

  return (
    <OfflineContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;