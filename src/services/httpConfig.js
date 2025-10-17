// Shared HTTP configuration helpers to keep API clients consistent

// Normalized API base URL with '/api/v1' prefix
export const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')}/api/v1`;

// CSRF naming conventions
export const CSRF = {
  cookieName: 'csrf_token',
  headerName: 'X-CSRF-Token',
};

// Method helpers
export const isGet = (method) => (method || 'get').toLowerCase() === 'get';
export const isMutation = (method) => {
  const m = (method || 'get').toLowerCase();
  return m === 'post' || m === 'put' || m === 'delete' || m === 'patch';
};

// Add cache-busting timestamp for GET requests
export const addCacheBuster = (config) => {
  if (isGet(config.method)) {
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
};
