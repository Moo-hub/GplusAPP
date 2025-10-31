import axios from "axios";
import { toast } from "react-toastify";
// Avoid statically importing the i18n module in this service so unit tests
// running in Node don't need to load JSON locale files. Instead, access a
// shared singleton attached to globalThis by the app's i18n bootstrap, or a
// lightweight test instance provided in setupTests.js.
const getI18nInstance = () => {
  try {
    // App runtime sets __GPLUS_I18N__; tests may set __TEST_I18N__
    return (typeof globalThis !== 'undefined' && (globalThis.__GPLUS_I18N__ || globalThis.__TEST_I18N__)) || null;
  } catch (_) { return null; }
};
const t = (key) => {
  try {
    const inst = getI18nInstance();
    if (inst && typeof inst.t === 'function') return inst.t(key);
  } catch (_) {}
  // Fallback to key for test environments or if i18n isn't initialized yet
  return key;
};

// For tracking API calls and setting global loading state
export const apiCallsInProgress = new Set();

// Create axios instance with base config
// Use an explicit absolute baseURL in test environments so Node's http
// adapter resolves to localhost instead of IPv6 ::1 which can cause
// MSW handler mismatches or ECONNREFUSED errors on some machines/CI.
// In test environments prefer a relative baseURL so msw's relative handlers
// match requests created by axios. Some adapters still construct absolute
// URLs; handlers provide absolute-URL predicates to catch those. Use an
// explicit relative '' base in tests to avoid accidental external network
// calls while keeping handler compatibility.
const computedBaseURL = (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')
  ? ''
  : (process.env.NODE_ENV === 'development' ? '/api' : '/api');

const api = axios.create({
  // baseURL may be absolute in tests to avoid IPv6/host resolution issues
  baseURL: computedBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout
  timeout: 10000,
});

// Note: Adapter forcing for Node test environments has been removed to
// ensure browser builds bundle cleanly. Axios will choose a suitable
// adapter per-environment. MSW intercepts fetch/XHR in tests as needed.

// Request interceptor for adding auth token and tracking API calls
export const requestHandler = (config) => {
  // Add request to tracking Set
  const requestId = `${(config && config.method) || 'get'}:${(config && config.url) || ''}`;
  apiCallsInProgress.add(requestId);
  
  // Store requestId on config for later reference
  config.requestId = requestId;
  
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
  
  return config;
};

export const requestErrorHandler = (error) => {
  console.error("Request error:", error);
  return Promise.reject(error);
};

api.interceptors.request.use(requestHandler, requestErrorHandler);

// Response interceptor for handling errors
export const responseHandler = (response) => {
  // Remove request from tracking Set when done
  if (response?.config?.requestId) {
    apiCallsInProgress.delete(response.config.requestId);
  }

  return response.data;
};

export const responseErrorHandler = (error) => {
  // Remove request from tracking Set even on error
  if (error?.config?.requestId) {
    apiCallsInProgress.delete(error.config.requestId);
  }

  // Log errors in development environment
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      error
    });
  }

  const errorMessage = error.response?.data?.detail || t("errors.generalError");

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

  // Don't show toast for authentication errors - we'll handle those separately
  if (error.response?.status !== 401) {
    toast.error(errorMessage);
  }

  // Handle 401 Unauthorized - redirect to login
  if (error.response?.status === 401) {
    // This will be handled in the AuthContext
    const event = new CustomEvent("auth-error", { detail: error });
    window.dispatchEvent(event);
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || (typeof error.message === 'string' && error.message.includes('timeout'))) {
    toast.error(t("errors.requestTimeout"));
  }

  // Report severe errors to monitoring service (if available)
  if (error.response?.status >= 500 && typeof window !== 'undefined' && window.errorReporter) {
    try {
      window.errorReporter.captureException(error);
    } catch (e) {
      // swallow if errorReporter isn't compatible in test env
    }
  }

  return Promise.reject(error);
};

api.interceptors.response.use(responseHandler, responseErrorHandler);

/**
 * Helper function to handle API response and apply consistent error handling
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<any>} - The API response data
 */
const apiHandler = async (apiCall, options = {}) => {
  try {
    const res = await apiCall();
    // If the underlying HTTP client (or a test mock) returns an object
    // with a `data` property (axios-style), unwrap it here so callers
    // receive the actual payload. This keeps components and tests
    // resilient to whether interceptors ran or a lightweight mock was
    // used that doesn't apply response interceptors.
    if (res && typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'data')) {
      return res.data;
    }
    return res;
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
  // Prefer the hyphenated payment-methods endpoint which MSW handlers expose
  return apiHandler(() => api.get("/payment-methods"), options);
};

export default api;

