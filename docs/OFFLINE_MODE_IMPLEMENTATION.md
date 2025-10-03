# Offline Mode Implementation Guide

## Overview

The G+ Recycling App features comprehensive offline functionality, allowing users to continue using the application even when they don't have an internet connection. This guide provides a detailed explanation of the offline mode architecture, implementation details, usage instructions, and testing approaches.

## User Experience

With offline mode enabled, users can:

1. **Browse previously loaded content** - Access companies, pickup history, and points information
2. **Create new pickup requests** - Schedule pickups that will sync when back online
3. **View their profile and statistics** - Access personal data and performance metrics
4. **Receive clear status notifications** - Know when they're working offline and what features are available
5. **Synchronize automatically** - Changes made offline are automatically synchronized when connectivity returns

### Example User Flow

1. User is browsing the app with a stable connection
2. Network connection is lost (e.g., entering an elevator, subway, or area with poor reception)
3. User receives an offline mode notification
4. User continues creating a pickup request
5. Request is stored locally and queued for synchronization
6. When connection is restored, the app automatically synchronizes the pending request
7. User receives a notification that synchronization is complete

## Technical Architecture

The offline functionality is built on a multi-layered architecture that combines modern web technologies to provide a seamless offline experience:

```
┌───────────────────────────┐
│   User Interface Layer     │
│                           │
│  ┌─────────────────────┐  │
│  │ Offline Notification │  │
│  └─────────────────────┘  │
│            │              │
│  ┌─────────────────────┐  │
│  │     React UI        │  │
│  └─────────────────────┘  │
└───────────┬───────────────┘
            │
┌───────────▼───────────────┐
│   Application Logic Layer  │
│                           │
│  ┌─────────────────────┐  │
│  │  Offline Context    │  │
│  └─────────────────────┘  │
│            │              │
│  ┌─────────────────────┐  │
│  │  Enhanced API       │  │
│  └─────────────────────┘  │
└───────────┬───────────────┘
            │
┌───────────▼───────────────┐
│     Data Storage Layer     │
│                           │
│  ┌─────────────────────┐  │
│  │    IndexedDB        │  │
│  └─────────────────────┘  │
│            │              │
│  ┌─────────────────────┐  │
│  │  Request Queue      │  │
│  └─────────────────────┘  │
└───────────┬───────────────┘
            │
┌───────────▼───────────────┐
│   Network Handling Layer   │
│                           │
│  ┌─────────────────────┐  │
│  │   Service Worker    │  │
│  └─────────────────────┘  │
│            │              │
│  ┌─────────────────────┐  │
│  │ Background Sync API  │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

### Key Technologies

- **Service Workers**: Enables caching and offline functionality
- **IndexedDB**: Provides client-side storage for offline data
- **Background Sync API**: Manages synchronization when connection is restored
- **React Context API**: Provides application-wide offline state management
- **Workbox**: Google's library for service worker management and caching strategies

## Implementation Components

### 1. Service Worker (`src/service-worker.js`)

The service worker serves as the foundation for our offline capabilities by:

- **Precaching critical assets**: HTML, CSS, JS, and images required for the application to function offline
- **Implementing caching strategies**:
  - `StaleWhileRevalidate` for API requests (uses cached version while updating in background)
  - `CacheFirst` for static assets (prioritizes cached version for performance)
  - `NetworkFirst` for dynamic content (tries network first, falls back to cache)
- **Background sync**: Queues requests made while offline and automatically retries when connection is restored
- **Custom offline page**: Falls back to a dedicated offline page when the user attempts to access unavailable content

#### Service Worker Registration

```javascript
// src/serviceWorkerRegistration.js
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker registered: ', registration);
          // Set up background sync functionality
          setupBackgroundSync(registration);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

function setupBackgroundSync(registration) {
  if ('sync' in registration) {
    // Register for background sync
    navigator.serviceWorker.ready
      .then(reg => {
        // Register sync tag for pending requests
        return reg.sync.register('sync-pending-requests');
      })
      .catch(err => console.log('Background sync registration failed:', err));
  }
}
```

### 2. IndexedDB Storage (`src/utils/offlineStorage.js`)

The IndexedDB implementation provides:

- **Persistent data storage**: Maintains application data across sessions
- **Structured data stores**:
  - `pickups`: User's pickup requests and their status
  - `userData`: User profile and preferences
  - `points`: Points balance and transaction history
  - `companies`: Recycling company information
  - `pendingRequests`: Network requests made while offline
- **CRUD operations**: Complete set of functions for data manipulation
- **Request queueing**: System to store requests for later synchronization

#### Database Schema

```javascript
// Database initialization
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GplusOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores with indexes
      if (!db.objectStoreNames.contains('pickups')) {
        const pickupStore = db.createObjectStore('pickups', { keyPath: 'id' });
        pickupStore.createIndex('userId', 'userId', { unique: false });
        pickupStore.createIndex('status', 'status', { unique: false });
        pickupStore.createIndex('date', 'scheduledDate', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('points')) {
        const pointsStore = db.createObjectStore('points', { keyPath: 'id' });
        pointsStore.createIndex('userId', 'userId', { unique: false });
        pointsStore.createIndex('date', 'date', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('companies')) {
        const companiesStore = db.createObjectStore('companies', { keyPath: 'id' });
        companiesStore.createIndex('name', 'name', { unique: false });
        companiesStore.createIndex('location', 'location', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const pendingStore = db.createObjectStore('pendingRequests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('url', 'url', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
```

#### Example Storage Operations

```javascript
// Store pickup request
export async function storePickup(pickup) {
  const db = await initializeDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pickups'], 'readwrite');
    const store = transaction.objectStore('pickups');
    const request = store.put(pickup);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

// Add pending request to queue
export async function addPendingRequest(request) {
  const db = await initializeDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRequests'], 'readwrite');
    const store = transaction.objectStore('pendingRequests');
    const req = store.add({
      url: request.url,
      method: request.method,
      body: request.body,
      headers: request.headers,
      timestamp: new Date().getTime(),
      retryCount: 0
    });
    
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    transaction.oncomplete = () => db.close();
  });
}
```

### 3. Offline Context Provider (`src/contexts/OfflineContext.jsx`)

The React context provider offers:

- **Network status detection**: Real-time tracking of online/offline status
- **Offline mode management**: Controls application behavior when offline
- **Pending request management**: Interface for accessing and manipulating queued requests
- **Synchronization logic**: Functionality to retry requests when connection is restored
- **Hooks interface**: Simple API for components to access offline functionality

#### Context Implementation

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPendingRequests, removePendingRequest } from '../utils/offlineStorage';
import { processPendingRequest } from '../services/enhancedApi';

// Create context
const OfflineContext = createContext();

// Provider component
export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Load pending requests from IndexedDB
  useEffect(() => {
    async function loadPendingRequests() {
      try {
        const requests = await getPendingRequests();
        setPendingRequests(requests);
      } catch (error) {
        console.error('Error loading pending requests:', error);
      }
    }
    
    loadPendingRequests();
    
    // Set up listener for changes to pending requests
    const checkPendingRequestsInterval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(checkPendingRequestsInterval);
  }, []);
  
  // Sync pending requests when coming back online
  useEffect(() => {
    if (isOnline && pendingRequests.length > 0 && !isSyncing) {
      syncPendingRequests();
    }
  }, [isOnline, pendingRequests, isSyncing]);
  
  // Function to manually trigger synchronization
  const syncPendingRequests = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const requests = [...pendingRequests];
      let successCount = 0;
      
      for (const request of requests) {
        try {
          await processPendingRequest(request);
          await removePendingRequest(request.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to process request ${request.id}:`, error);
        }
      }
      
      // Refresh pending requests list
      const remaining = await getPendingRequests();
      setPendingRequests(remaining);
      
      return {
        success: true,
        processed: successCount,
        remaining: remaining.length
      };
    } catch (error) {
      console.error('Error during synchronization:', error);
      return { success: false, error };
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Context value
  const value = {
    isOnline,
    isSyncing,
    pendingRequests,
    pendingRequestCount: pendingRequests.length,
    syncPendingRequests,
  };
  
  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

// Custom hook for using offline context
export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
```

#### Using the Offline Context

```jsx
import { useOffline } from '../contexts/OfflineContext';

function MyComponent() {
  const { isOnline, pendingRequestCount, syncPendingRequests } = useOffline();
  
  return (
    <div>
      {!isOnline && (
        <div className="offline-banner">
          You are currently offline
        </div>
      )}
      
      {pendingRequestCount > 0 && isOnline && (
        <button onClick={syncPendingRequests}>
          Sync {pendingRequestCount} pending requests
        </button>
      )}
      
      {/* Rest of component */}
    </div>
  );
}
```

### 4. Enhanced API Service (`src/services/enhancedApi.js`)

The API service enhancements include:

- **Request interceptors**: Detect offline status and queue requests accordingly
- **Response caching**: Store API responses for offline use
- **Error handling**: Graceful degradation when network requests fail
- **Sync management**: Interface with offline context to manage request queue
- **Retry logic**: Smart retry strategies for failed requests

#### Enhanced API Implementation

```javascript
import axios from 'axios';
import { addPendingRequest, storeApiResponse, getApiResponse } from '../utils/offlineStorage';

// Create enhanced axios instance
const enhancedApi = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000
});

// Request interceptor
enhancedApi.interceptors.request.use(
  async (config) => {
    // Check if online
    if (!navigator.onLine) {
      // For GET requests, try to return cached data
      if (config.method === 'get') {
        try {
          // Create a unique key for this request
          const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
          
          // Try to get from cache
          const cachedResponse = await getApiResponse(cacheKey);
          
          if (cachedResponse) {
            console.log('Using cached response for:', config.url);
            
            // Create a "mock" adapter response that axios will understand
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK (Cached)',
              headers: cachedResponse.headers,
              config,
              cached: true
            });
          }
        } catch (error) {
          console.error('Error retrieving cached response:', error);
        }
      }
      
      // For non-GET requests or if no cache is available
      // Add to pending requests queue
      console.log('Queuing offline request:', config.url);
      await addPendingRequest({
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params,
        headers: config.headers
      });
      
      // Throw a custom error that our UI can handle appropriately
      return Promise.reject({
        isOffline: true,
        message: 'Request queued for when connection is restored'
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
enhancedApi.interceptors.response.use(
  async (response) => {
    // Cache successful GET responses for offline use
    if (response.config.method === 'get' && !response.cached) {
      try {
        const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
        await storeApiResponse(cacheKey, {
          data: response.data,
          headers: response.headers,
          timestamp: new Date().getTime()
        });
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }
    
    return response;
  },
  (error) => Promise.reject(error)
);

// Function to process pending requests when back online
export async function processPendingRequest(request) {
  try {
    // Create a new axios request from the stored data
    const response = await enhancedApi({
      url: request.url,
      method: request.method,
      data: request.data,
      params: request.params,
      headers: request.headers
    });
    
    return response;
  } catch (error) {
    // If this is a server error or other issue, throw
    // to let the caller handle it
    throw error;
  }
}

export default enhancedApi;
```

### 5. User Interface Components

#### OfflineNotification Component (`src/components/OfflineNotification.jsx`)

- **Visual feedback**: Clearly communicates offline status to users
- **Pending requests indicator**: Shows number of operations waiting to sync
- **Manual sync control**: Allows users to trigger synchronization
- **Responsive design**: Works across all device sizes
- **RTL support**: Properly handles right-to-left languages

#### Layout Integration (`src/components/Layout.jsx`)

- Incorporates OfflineNotification component at app-wide level
- Ensures consistent user experience across all pages

## Developer Usage Guide

### Setting Up Offline Support in Components

To implement offline support in your components, follow these patterns:

#### 1. Import the Offline Hook

```jsx
import { useOffline } from '../contexts/OfflineContext';
```

#### 2. Use the Offline Context in Your Component

```jsx
function PickupRequestForm() {
  const { isOnline, pendingRequestCount } = useOffline();
  
  // Conditionally render UI elements based on connection status
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {!isOnline && (
        <div className="offline-notice">
          You are offline. Your request will be submitted when your connection is restored.
        </div>
      )}
      
      <button type="submit" disabled={!isOnline && someCondition}>
        {isOnline ? 'Submit Request' : 'Save for Later'}
      </button>
    </form>
  );
}
```

#### 3. Use Enhanced API for Data Fetching

```jsx
import enhancedApi from '../services/enhancedApi';
import { useState, useEffect } from 'react';

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        const response = await enhancedApi.get('/companies');
        setCompanies(response.data);
        setError(null);
      } catch (error) {
        // Handle offline case gracefully
        if (error.isOffline) {
          setError({ message: 'Using offline data. Some information may not be current.' });
        } else {
          setError({ message: 'Failed to load companies. Please try again.' });
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchCompanies();
  }, []);
  
  return (
    <div>
      {error && <div className="error-banner">{error.message}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {companies.map(company => (
            <li key={company.id}>{company.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Best Practices

#### Optimizing for Offline First

1. **Prioritize Core Functionality**:
   - Identify and prioritize the most critical features users need offline
   - Design UI to clearly indicate which features are available offline

2. **Smart Data Management**:
   - Implement data prefetching for likely-to-be-needed resources
   - Set appropriate cache expiration policies based on data volatility
   - Consider data size limitations and prioritize essential information

3. **Conflict Resolution**:
   - Implement timestamp-based conflict resolution for simultaneous changes
   - Provide clear UI for conflict resolution when users reconnect
   - Always prefer server data for critical information when back online

4. **Network-Aware Components**:
   - Design components to adapt to network conditions
   - Disable network-dependent features when offline
   - Provide fallback UI for unavailable content

5. **Progressive Enhancement**:
   - Build core functionality to work without JavaScript or service workers
   - Add offline capabilities as an enhancement
   - Ensure the app is usable even on browsers without full offline support

#### Security Considerations

1. **Sensitive Data**: Avoid caching sensitive information in IndexedDB
2. **Authentication**: Handle token expiration appropriately during offline periods
3. **Data Validation**: Re-validate cached data when reconnecting to prevent stale data issues

## Test Coverage Plan

### Unit Tests

#### 1. OfflineNotification Component Test (`tests/OfflineNotification.test.jsx`)

Tests the offline notification component to ensure it:

- Does not render when online and no pending requests exist
- Shows appropriate messaging when offline
- Displays correct pending request count
- Triggers sync function when "Sync Now" button is clicked

#### 2. OfflineContext Test (`tests/OfflineContext.test.jsx`)

Tests the offline context provider to ensure it:

- Initializes with correct default values
- Properly detects network status changes
- Allows adding pending requests when offline
- Successfully synchronizes requests when coming back online

#### 3. OfflineStorage Utility Test (`tests/offlineStorage.test.js`)

Tests the IndexedDB wrapper to ensure it:

- Successfully initializes the database
- Handles database initialization errors
- Successfully adds pending requests
- Retrieves pending requests
- Marks requests as synced
- Deletes synced requests

#### 4. Layout Integration Test (`tests/Layout.test.jsx`)

Tests the Layout component to ensure it:

- Properly includes the OfflineNotification component
- Renders all required elements (header, nav, main, footer)
- Shows/hides user-specific navigation based on authentication status

### Integration Tests

Future integration tests should cover:

1. Full offline workflow from going offline to reconnecting
2. Data synchronization between IndexedDB and server
3. Conflict resolution for simultaneous online/offline changes
4. Service worker cache invalidation and updates

### End-to-End Tests

Future end-to-end tests should cover:

1. Application functionality during network interruptions
2. Performance under various network conditions
3. Background sync while the application is closed
4. Service worker update flow

## Current Test Status

The test files have been created but require some dependency installations to run successfully. The application requires:

- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom (for Vitest)

## System Administration

### Monitoring Offline Usage

Offline usage patterns can be monitored through several mechanisms:

1. **Offline Events Logging**:
   - The application logs offline mode activation/deactivation events
   - Events are stored locally and synced when connection is restored
   - Includes duration of offline periods and actions taken while offline

2. **Synchronization Metrics**:
   - Track successful vs. failed synchronizations
   - Monitor average sync time and data volume
   - Identify frequently failing requests for optimization

3. **Cache Analytics**:
   - Monitor cache hit/miss rates for different resource types
   - Track cache size and expiration patterns
   - Identify opportunities for cache optimization

### Troubleshooting

#### Common Issues and Solutions

1. **Stale Data Issues**:
   - **Symptoms**: Users seeing outdated information even when online
   - **Solution**: Clear the application cache and refresh the application
   ```javascript
   // In browser console
   caches.keys().then(keys => {
     keys.forEach(key => caches.delete(key))
   })
   ```

2. **Failed Synchronization**:
   - **Symptoms**: Pending requests not syncing when online
   - **Solution**: Check for invalid or expired authentication tokens
   - **Fallback**: Manual synchronization through admin panel

3. **Excessive Storage Usage**:
   - **Symptoms**: Application using too much storage space
   - **Solution**: Adjust cache retention policies in configuration
   - **Cleanup**: Implement periodic cleanup of old cached data

#### Service Worker Management

Service workers require special attention for maintenance:

```javascript
// Force service worker update
navigator.serviceWorker.ready.then(registration => {
  registration.update();
});

// Unregister service worker (for troubleshooting)
navigator.serviceWorker.getRegistrations().then(registrations => {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### Configuration Options

The offline functionality can be configured via environment variables:

```
# Offline Mode Configuration
VITE_OFFLINE_MODE_ENABLED=true        # Enable/disable offline functionality
VITE_CACHE_RETENTION_DAYS=7           # Days to keep cached data
VITE_PREFETCH_ENABLED=true            # Enable prefetching of likely-needed resources
VITE_MAX_OFFLINE_STORAGE_MB=50        # Maximum local storage size in MB
VITE_SYNC_RETRY_ATTEMPTS=5            # Maximum sync retry attempts
```

## Performance Considerations

### Storage Quotas

Browsers enforce storage limits for IndexedDB and the Cache API. The application manages these limits by:

1. Prioritizing essential data for offline access
2. Implementing size-based eviction policies for cached resources
3. Monitoring storage usage and warning users when approaching limits

### Battery Impact

Offline capabilities can impact battery life. The application minimizes this by:

1. Batching synchronization operations when coming back online
2. Using efficient background sync scheduling
3. Limiting wake-ups and polling frequency

## Conclusion

The offline mode implementation provides a robust foundation for offline functionality in the G+ Recycling App. Users can now continue using core features even without an internet connection, with changes automatically synchronizing when connectivity is restored.

By leveraging modern web technologies like Service Workers, IndexedDB, and the Background Sync API, the application delivers a resilient experience that works reliably even in areas with intermittent connectivity. This implementation follows best practices for progressive web applications and ensures that users can access critical functionality regardless of network conditions.

### Future Enhancements

The next steps for improving offline support include:

1. **Enhanced Conflict Resolution**: More sophisticated strategies for resolving conflicts between offline and online data
2. **Selective Synchronization**: Allowing users to choose what data to sync when on limited connections
3. **Predictive Prefetching**: Using machine learning to predict and prefetch likely-needed resources
4. **Compression Algorithms**: Implementing data compression for efficient storage utilization
5. **Offline Analytics**: Collecting detailed analytics on offline usage patterns
6. **Cross-Device Synchronization**: Syncing offline changes across multiple user devices

### Related Documentation

- [Progressive Web App Guide](./PWA_GUIDE.md)
- [Service Worker Implementation](./SERVICE_WORKER_IMPLEMENTATION.md)
- [Client-Side Storage Guide](./CLIENT_SIDE_STORAGE.md)
- [API Reference: Offline Mode](./API_REFERENCE.md#offline-mode)
