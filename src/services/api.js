import axios from 'axios';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { useToast } from '../components/toast/Toast';
import TokenService from './token';
import CSRFService from './csrf';
import { API_BASE_URL, CSRF, isGet, isMutation, addCacheBuster } from './httpConfig';

// Create a hook wrapper for non-component environments
let toastFunctions = null;

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

// Middleware to get toast functions in non-component context
export const initializeApiToastFunctions = (showError, showSuccess) => {
  toastFunctions = { showError, showSuccess };
};

// Create a component that will initialize the toast functions
export const ApiToastInitializer = () => {
  const toast = useToast();
  React.useEffect(() => {
    initializeApiToastFunctions(toast.showError, toast.showSuccess);
  }, [toast]);
  return null;
};

export const initApiInterceptors = () => {
  // Request interceptor for adding token to headers
  api.interceptors.request.use(
    async (config) => {
    // Skip token refresh for auth endpoints to avoid infinite loops
    if (config.url.includes('/auth/login') || config.url.includes('/auth/refresh')) {
      return config;
    }
    
    let token = TokenService.getAccessToken();
    
    // Check if token is expired
    if (token && TokenService.isTokenExpired(token)) {
      try {
        // Try to refresh the token
        token = await TokenService.refreshAccessToken();
      } catch (error) {
        // If refresh fails, proceed without token
        console.warn('Token refresh failed, proceeding without authentication');
        TokenService.removeTokens();
      }
    }
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching for GET requests
    addCacheBuster(config);
    
    // Add CSRF token if available for mutation requests
    const csrfToken = CSRFService.getToken();
    if (csrfToken && isMutation(config.method)) {
      config.headers[CSRF.headerName] = csrfToken;
    }
    
    return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling common errors
  api.interceptors.response.use(
    (response) => {
    // Extract and save CSRF token from response if available
    if (response.data && response.data.csrf_token) {
      // Use CSRFService to store the token
      CSRFService.setToken(response.data.csrf_token);
    }
    return response;
  },
    async (error) => {
    const originalRequest = error.config;
    const { response } = error;
    
    // Don't retry already retried requests to avoid infinite loops
    if (!originalRequest || originalRequest._retry) {
      // Just let the error through for normal handling
    }
    // If the error is due to an expired token and we haven't tried refreshing yet
    else if (response && response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const newToken = await TokenService.refreshAccessToken();
        
        // If successful, update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // If token refresh fails, clear tokens and let the error through
        TokenService.removeTokens();
      }
    }
    
    // Standard error handling for all errors (including those after refresh attempt fails)
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          TokenService.removeTokens();
          
          // Show unauthorized message if toast functions available
          if (toastFunctions?.showError) {
            toastFunctions.showError('Your session has expired. Please log in again.');
          }
          
          // Redirect to login page if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?redirect=${window.location.pathname}`;
          }
          break;
          
        case 403:
          // Forbidden
          if (toastFunctions?.showError) {
            toastFunctions.showError('You do not have permission to perform this action');
          }
          break;
          
        case 419: // Laravel/Symfony CSRF token mismatch
        case 422: // CSRF token mismatch in some frameworks
          // Try to refresh the CSRF token
          CSRFService.refreshToken().catch(() => {
            if (toastFunctions?.showError) {
              toastFunctions.showError('Your session has expired. Please refresh the page and try again.');
              // Force reload to get a fresh CSRF token if refresh failed
              setTimeout(() => window.location.reload(), 2000);
            }
          });
          break;
          
        case 500:
          // Server error
          if (toastFunctions?.showError) {
            toastFunctions.showError('A server error occurred. Please try again later.');
          }
          break;
          
        default:
          // Other errors
          if (response.status >= 400 && toastFunctions?.showError) {
            const message = response.data?.message || 'An error occurred';
            toastFunctions.showError(message);
          }
      }
    } else if (error.request) {
      // Network error
      if (toastFunctions?.showError) {
        toastFunctions.showError('Network error. Please check your connection.');
      }
    }
    
      return Promise.reject(error);
    }
  );
};

// Initialize interceptors automatically outside of test mode
try {
  // Vitest provides import.meta.env.MODE === 'test'
  // In non-test environments, set up interceptors immediately
  if (!(import.meta && import.meta.env && import.meta.env.MODE === 'test')) {
    // Create and initialize the default instance in non-test environments
    createApiInstance();
  }
} catch {
  // Fallback for environments without import.meta
  createApiInstance();
}

export default api;