import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import './OfflineNotification.css';

/**
 * OfflineNotification component displays a banner when the user is offline
 * or when there are pending offline requests to be synchronized
 */
const OfflineNotification = () => {
  const { isAppOffline, pendingRequests, syncPendingRequests } = useOffline();
  
  if (!isAppOffline && pendingRequests.length === 0) {
    return null;
  }
  
  return (
    <div 
      className={`offline-notification ${isAppOffline ? 'offline' : 'pending'}`}
      role="alert"
      aria-live="polite"
    >
      {isAppOffline ? (
        <div className="offline-content">
          <span className="offline-icon" aria-hidden="true">📶</span>
          <span className="offline-message">You are currently offline. Some features may be limited.</span>
        </div>
      ) : (
        <div className="offline-content">
          <span className="offline-icon" aria-hidden="true">🔄</span>
          <span className="offline-message">
            {pendingRequests.length} {pendingRequests.length === 1 ? 'request' : 'requests'} waiting to sync
          </span>
          <button 
            className="sync-button" 
            onClick={syncPendingRequests}
            aria-label={`Sync ${pendingRequests.length} pending ${pendingRequests.length === 1 ? 'request' : 'requests'}`}
          >
            Sync Now
          </button>
        </div>
      )}
    </div>
  );
};

export default OfflineNotification;