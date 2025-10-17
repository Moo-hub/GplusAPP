import axios from "axios";

// Ensure axios sends cookies (for CSRF/refresh)
axios.defaults.withCredentials = true;
import { toast } from "react-toastify";
import i18n from "../i18n/i18n";

// For tracking API calls and setting global loading state
export const apiCallsInProgress = new Set();

// Create axios instance with fixed baseURL (mutable for tests)
let api;

// Allow test to inject a mock axios instance
export const setApiInstance = (instance) => {
  api = instance;
};

export const createApiInstance = (config = {
  baseURL: 'http://localhost:8000/api/v1',
  headers: { "Content-Type": "application/json" },
}) => {
  // If a test has injected a mock, don't overwrite it
  if (!api) {
    api = axios.create(config);
  }
  return api;
};

// Request interceptor for adding auth token and tracking API calls
export const requestInterceptor = (config) => {
    // Add request to tracking Set
    const requestId = `${config.method}:${config.url}`;
    apiCallsInProgress.add(requestId);
    
    // Store requestId on config for later reference
  // @ts-ignore - augmenting config object with a tracking id
  config.requestId = requestId;
    
    // No need to rewrite login endpoint if baseURL is correct

    // Add auth token if present
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available (for non-GET methods)
    if (config.method !== 'get') {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // No need to transform FormData for login; handled by caller

    // Temporary debug: log outgoing login requests
    if (config.url && config.url.includes('/auth/login')) {
      // eslint-disable-next-line no-console
      console.log('[API] Sending', config.method?.toUpperCase(), 'to', config.baseURL + config.url, 'CT:', config.headers['Content-Type']);
    }
    
    return config;
};

export const requestErrorHandler = (error) => {
  console.error("Request error:", error);
  return Promise.reject(error);
};


// Response interceptor for handling errors
export const responseInterceptor = (response) => {
  // Remove request from tracking Set when done
  // @ts-ignore - custom property added above
  if (response.config.requestId) {
    // @ts-ignore - custom property added above
    apiCallsInProgress.delete(response.config.requestId);
  }
  return response.data;
};

// Helper to refresh token (imported from csrf.js or similar)
async function refreshToken() {
  if (window.refreshToken) {
    return window.refreshToken();
  }
  try {
    await api.post('/auth/refresh');
  } catch (e) {}
}

export const responseErrorHandler = async (error) => {
  if (error.config?.requestId) {
    apiCallsInProgress.delete(error.config.requestId);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      error
    });
  }

  const errorMessage = error.response?.data?.detail || i18n.t("errors.generalError");

  // Emit event for global error tracking
  const errorEvent = new CustomEvent("api-error", { 
    detail: {
      error,
      message: errorMessage,
      endpoint: error.config?.url,
      method: error.config?.method,
      timestamp: new Date()
    }
  });
  window.dispatchEvent(errorEvent);

  // Automatic retry logic for 401 Unauthorized
  if (error.response?.status === 401 && !error.config.__isRetryRequest) {
    try {
      await refreshToken();
      error.config.__isRetryRequest = true;
      return api(error.config);
    } catch (refreshError) {
      const event = new CustomEvent("auth-error", { detail: error });
      window.dispatchEvent(event);
    }
  }

  // Don't show toast for authentication errors - we'll handle those separately
  if (error.response?.status !== 401) {
    toast.error(errorMessage);
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    toast.error(i18n.t("errors.requestTimeout"));
  }

  // Report severe errors to monitoring service (if available)
  // @ts-ignore - optional global reporter may be injected in some builds
  if (error.response?.status >= 500 && window.errorReporter) {
    // @ts-ignore
    window.errorReporter.captureException(error);
  }

  return Promise.reject(error);
};

export const initApiInterceptors = () => {
  if (!api) createApiInstance();
  api.interceptors.request.use(requestInterceptor, requestErrorHandler);
  api.interceptors.response.use(responseInterceptor, responseErrorHandler);
  return api;
};

/**
 * Helper function to handle API response and apply consistent error handling
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<any>} - The API response data
 */
const apiHandler = async (apiCall, options = {}) => {
  try {
    return await apiCall();
  } catch (error) {
    // Custom error handling logic can be added here
    // This allows for endpoint-specific error handling beyond the interceptors
    if (options.onError) {
      options.onError(error);
    }
    throw error;
  }
};

// API service methods with consistent error handling
export const getPickups = async (options = {}) => {
  return apiHandler(() => api.get("/pickups"), options);
};

export const createPickup = async (pickupData, options = {}) => {
  return apiHandler(() => api.post("/pickups", pickupData), options);
};

export const getPickupSchedule = async (options = {}) => {
  return apiHandler(() => api.get("/pickups/schedule"), options);
};

export const getVehicles = async (options = {}) => {
  return apiHandler(() => api.get("/vehicles"), options);
};

export const getPoints = async (options = {}) => {
  return apiHandler(() => api.get("/points"), options);
};

export const getCompanies = async (options = {}) => {
  return apiHandler(() => api.get("/companies"), options);
};

export const getPaymentMethods = async (options = {}) => {
  return apiHandler(() => api.get("/payments/methods"), options);
};

// Initialize immediately unless a test has injected a mock
if (!api) {
  createApiInstance();
  initApiInterceptors();
}

export default api;

