import axios from 'axios';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { useToast } from '../components/toast/Toast';
import TokenService from './token';
import { Stores, getItem, getAllItems, addItem, updateItem } from '../utils/offlineStorage';
import { API_BASE_URL, CSRF, isGet, isMutation, addCacheBuster } from './httpConfig';

// Create a hook wrapper for non-component environments
let toastFunctions = null;
let offlineContext = null;

// Create an Axios instance with default config
let api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: CSRF.cookieName,
  xsrfHeaderName: CSRF.headerName,
});

// Allow tests to inject a custom axios instance
export const setApiInstance = (instance) => {
  api = instance;
};

export const createApiInstance = () => {
  api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    xsrfCookieName: CSRF.cookieName,
    xsrfHeaderName: CSRF.headerName,
  });
  initApiInterceptors();
  return api;
};

export const initApiInterceptors = () => {
  // Request interceptor for adding auth token and handling offline mode
  api.interceptors.request.use(
    async (config) => {
      // Add auth token if available
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // If CSRF token is available in localStorage, add it to headers
      const csrfToken = localStorage.getItem('csrfToken');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }

      // Handle offline mode
      if (offlineContext && offlineContext.isAppOffline) {
        // For GET requests, try to get cached data
        if (isGet(config.method)) {
          const cachedDataPromise = handleOfflineGetRequest(config);
          return Promise.reject({
            isOffline: true,
            cachedDataPromise,
            config
          });
        } else {
          // For non-GET requests, queue them for later
          if (offlineContext.queueRequest) {
            await offlineContext.queueRequest({
              url: config.url,
              method: config.method,
              body: config.data,
              headers: config.headers
            });
            // Notify user that the request was queued
            if (toastFunctions) {
              toastFunctions.showSuccess('Request saved for when you\'re back online');
            }
          }
          return Promise.reject({
            isOffline: true,
            config
          });
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling errors
  api.interceptors.response.use(
    (response) => {
      // If the response contains a new CSRF token, store it
      if (response.data && response.data.csrf_token) {
        localStorage.setItem('csrfToken', response.data.csrf_token);
      }
      // Cache successful GET responses for offline use
      if (isGet(response.config.method)) {
        cacheResponse(response.config.url, response.data);
      }
      return response;
    },
    async (error) => {
      // Handle offline mode requests
      if (error.isOffline) {
        if (error.cachedDataPromise) {
          try {
            // For GET requests, return cached data if available
            const cachedData = await error.cachedDataPromise;
            return {
              data: cachedData,
              status: 200,
              fromCache: true,
              config: error.config
            };
          } catch (cacheError) {
            console.error('Error retrieving cached data:', cacheError);
            throw {
              response: {
                status: 503,
                data: { message: 'You are offline and no cached data is available' }
              }
            };
          }
        } else {
          // For non-GET requests that were queued
          return {
            status: 202,
            data: { message: 'Request queued for when you\'re back online' },
            queued: true
          };
        }
      }

      // Handle 401 Unauthorized - token expired
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        try {
          await TokenService.refreshToken();
          // If successful, retry the original request
          const token = getToken();
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          if (toastFunctions) {
            toastFunctions.showError('Your session has expired. Please log in again.');
          }
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      // Handle other errors
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.detail || 'An unexpected error occurred';
        if (toastFunctions && error.config.showErrorToast !== false) {
          toastFunctions.showError(errorMessage);
        }
      } else if (error.request) {
        // No response received
        if (!navigator.onLine) {
          if (toastFunctions && error.config.showErrorToast !== false) {
            toastFunctions.showError('You are offline. Some features may be limited.');
          }
        } else {
          if (toastFunctions && error.config.showErrorToast !== false) {
            toastFunctions.showError('Network error. Please try again later.');
          }
        }
      } else {
        // Error in setting up the request
        if (toastFunctions && error.config.showErrorToast !== false) {
          toastFunctions.showError('An error occurred. Please try again.');
        }
      }
      return Promise.reject(error);
    }
  );
};

// Middleware to get toast functions in non-component context
export const initializeApiToastFunctions = (showError, showSuccess) => {
  toastFunctions = { showError, showSuccess };
};

// Middleware to get offline context in non-component context
export const initializeOfflineContext = (context) => {
  offlineContext = context;
};

// Create a component that will initialize the toast functions
export const ApiToastInitializer = () => {
  const toast = useToast();
  React.useEffect(() => {
    initializeApiToastFunctions(toast.showError, toast.showSuccess);
  }, [toast.showError, toast.showSuccess]);
  return null;
};

// Function to get the auth token from localStorage
const getToken = () => localStorage.getItem('token');


// Function to handle offline GET requests
async function handleOfflineGetRequest(config) {
  const url = config.url;
  const cacheKey = `cache:${url}`;
  
  try {
    // Try to get data from IndexedDB
    const cachedData = await getItem(Stores.USER_DATA, cacheKey);
    if (cachedData && cachedData.data) {
      console.log('Found cached data for', url);
      return cachedData.data;
    }
    
    throw new Error('No cached data found');
  } catch (error) {
    console.error('Error getting cached data:', error);
    throw error;
  }
}

// Function to cache responses for offline use
async function cacheResponse(url, data) {
  if (!url) return;
  
  const cacheKey = `cache:${url}`;
  try {
    await updateItem(Stores.USER_DATA, {
      key: cacheKey,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error caching response:', error);
  }
}


// Initialize interceptors automatically outside of test mode
try {
  if (!(import.meta && import.meta.env && import.meta.env.MODE === 'test')) {
    createApiInstance();
  }
} catch {
  createApiInstance();
}

export default api;