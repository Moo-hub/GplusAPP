import apiClient from './apiClient.js';
import { logError } from '../logError.js';
// Import i18n with graceful fallback
let i18n;
try { i18n = require('../i18n/i18n').default; } catch (e) { i18n = { t: (k) => k }; }

// Track API calls if needed
export const apiCallsInProgress = new Set();

// A small wrapper to keep compatibility with the previous API surface.
// apiClient already configures adapter and interceptors; here we use
// apiClient to perform requests and unwrap axios-style responses.
const apiHandler = async (apiCall, options = {}) => {
  try {
    const res = await apiCall();
    if (res && typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'data')) return res.data;
    return res;
  } catch (error) {
    void error;
    // preserve original behavior: notify UI / toasts if needed
  try { logError('API handler error:', error); } catch (e) { void e; try { require('./../utils/logger').error('API handler error', error); } catch (er) { void er; } }
    if (options.onError) options.onError(error);
    throw error;
  }
};

// Exported handlers for unit tests and for manual interceptor installation
export const requestHandler = (config) => {
  try {
    // tests expect token stored under 'token'
    const token = localStorage.getItem('token');
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    void e; // ignore - best-effort header handling
    config.headers = config.headers || {};
  }
  return config;
};

export const responseHandler = (response) => {
  try {
    if (response && Object.prototype.hasOwnProperty.call(response, 'data')) return response.data;
  } catch (e) { void e; }
  return response;
};

export const responseErrorHandler = async (error) => {
  try {
    try { console.log('API: responseErrorHandler called with', error && error.response && error.response.status); } catch (e) {}
    const { response } = error || {};
    if (response) {
      if (response.status === 401) {
        // notify app of auth problems
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('auth-error', { detail: { detail: error } }));
          }
        } catch (e) {}
        return Promise.reject(error);
      }

      // Prefer detail/message from body
      const msg = (response.data && (response.data.detail || response.data.message)) || i18n.t('errors.generalError');
          try {
            try { console.log('API: about to import toast wrapper, msg=', msg); } catch (e) {}
            // import wrapper module dynamically so we're compatible with ESM test runners
            const twMod = await import('../utils/toast.js');
            if (twMod && typeof (twMod.default || twMod).error === 'function') {
              (twMod.default || twMod).error(msg);
            }
            try { console.log('API: called toast wrapper'); } catch (e) {}
            try {
              const loggerMod = await import('../utils/logger.js');
              const logger = loggerMod && loggerMod.default ? loggerMod.default : loggerMod;
              if (logger && typeof logger.debug === 'function') logger.debug('API: responseErrorHandler called toast.error with', msg);
            } catch (ee) { void ee; }
          } catch (e) { try { console.log('API: toast wrapper call error', e); } catch (er) {} }
    } else if (error && error.request) {
      try {
  const twReq2 = await import('../utils/toast.js');
        if (twReq2 && typeof (twReq2.default || twReq2).error === 'function') {
          (twReq2.default || twReq2).error(i18n.t('errors.networkError') || 'errors.generalError');
        }
        try { const loggerMod2 = await import('../utils/logger.js'); const logger2 = (loggerMod2 && loggerMod2.default) ? loggerMod2.default : loggerMod2; if (logger2 && typeof logger2.debug === 'function') logger2.debug('API: responseErrorHandler network error toast'); } catch (ee) { void ee; }
      } catch (e) {}
    } else {
      try {
  const twReq3 = await import('../utils/toast.js');
        if (twReq3 && typeof (twReq3.default || twReq3).error === 'function') {
          (twReq3.default || twReq3).error(i18n.t('errors.generalError'));
        }
        try { const loggerMod3 = await import('../utils/logger.js'); const logger3 = (loggerMod3 && loggerMod3.default) ? loggerMod3.default : loggerMod3; if (logger3 && typeof logger3.debug === 'function') logger3.debug('API: responseErrorHandler default error toast'); } catch (ee) { void ee; }
      } catch (e) {}
    }
  } catch (e) {
    // swallow logging errors
    try { logError('Request error', e); } catch (er) {}
  }
  return Promise.reject(error);
};

export const getPickups = async (options = {}) => apiHandler(() => apiClient.get('/pickups'), options);
export const createPickup = async (pickupData, options = {}) => apiHandler(() => apiClient.post('/pickups', pickupData), options);
export const getPickupSchedule = async (options = {}) => apiHandler(() => apiClient.get('/pickups/schedule'), options);
export const getVehicles = async (options = {}) => apiHandler(() => apiClient.get('/vehicles'), options);
export const getPoints = async (options = {}) => apiHandler(() => apiClient.get('/points'), options);
export const getCompanies = async (options = {}) => apiHandler(() => apiClient.get('/companies'), options);
export const getPaymentMethods = async (options = {}) => apiHandler(() => apiClient.get('/payment-methods'), options);

export default apiClient;

