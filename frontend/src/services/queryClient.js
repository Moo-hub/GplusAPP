import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { logError } from '../logError';

// Resilient environment accessor: try to obtain Vite's `import.meta.env` at
// runtime using a dynamic function so TypeScript doesn't parse `import.meta`
// at build time (which can cause compile errors in some tsconfigs). Fall
// back to `process.env` or a global test-provided `__TEST_ENV__` when
// running under Vitest or older Node environments.
const _getEnv = () => {
  try {
    // Access import.meta.env via a runtime-evaluated function to avoid
    // static parsing by TypeScript/ESLint. This may return undefined in
    // environments that don't support import.meta.
    // eslint-disable-next-line no-new-func
    const getImportMetaEnv = new Function('try { return import.meta && import.meta.env; } catch (e) { return undefined }');
    const maybe = getImportMetaEnv();
    if (maybe) return maybe;
  } catch (e) {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process && process.env) return process.env;
  } catch (e) {
    // ignore
  }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__TEST_ENV__) return globalThis.__TEST_ENV__;
  } catch (e) {}
  return {};
};
const __ENV__ = _getEnv();

const isProd = () => {
  try {
    if (typeof __ENV__.PROD !== 'undefined') return __ENV__.PROD === true || String(__ENV__.PROD) === 'true';
    if (typeof __ENV__.NODE_ENV !== 'undefined') return String(__ENV__.NODE_ENV) === 'production';
  } catch (e) {}
  return false;
};

const isDev = () => {
  try {
    if (typeof __ENV__.DEV !== 'undefined') return __ENV__.DEV === true || String(__ENV__.DEV) === 'true';
  } catch (e) {}
  return !isProd();
};

/**
 * Create and configure the React Query client
 * 
 * @param {Object} options - Additional configuration options
 * @returns {QueryClient} Configured React Query client
 */
export const createQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
  // General query configuration
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: isProd(), // Only in production
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: (failureCount, error) => {
                // Don't retry on 404s and auth errors
                const _getStatus = (err) => {
                  try {
                    return (err && err.response && err.response.status) || err.status || err.statusCode || null;
                  } catch (e) { return null; }
                };
                const _status = _getStatus(error);
                if (_status === 404) return false;
                if (_status === 401) return false;
                if (_status === 403) return false;
          
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        // Show error toasts for query errors
        onError: (error) => {
          if (isDev()) {
            try { logError('Query error:', error); } catch (e) { try { const { error: loggerError } = require('../utils/logger'); loggerError('Query error:', error); } catch (er) {} }
          }

          // Only show toast for network errors or unexpected server errors
          try {
            const _status2 = (error && error.response && error.response.status) || error.status || error.statusCode || null;
            if (!_status2 || _status2 >= 500) {
              const msg = (error && error.response && error.response.data && error.response.data.message) || error.message || 'An error occurred while fetching data';
              toast.error(msg);
            }
          } catch (e) {
            try { toast.error(error && error.message ? error.message : 'An error occurred while fetching data'); } catch (er) {}
          }
        },
        ...options?.queries
      },
      mutations: {
        // Retry mutations once by default
        retry: 1,
        // Show error toasts for mutation errors
        onError: (error, variables, context) => {
          if (isDev()) {
            try { logError('Mutation error:', error, { variables, context }); } catch (e) { try { const { error: loggerError } = require('../utils/logger'); loggerError('Mutation error:', error, { variables, context }); } catch (er) {} }
          }

          try {
            const msg = (error && error.response && error.response.data && error.response.data.message) || error.message || 'An error occurred while saving data';
            toast.error(msg);
          } catch (e) {
            try { toast.error('An error occurred while saving data'); } catch (er) {}
          }
        },
        ...options?.mutations
      }
    }
  });
};

/**
 * Default React Query client instance
 */
export const queryClient = createQueryClient();

/**
 * Common query keys used throughout the application
 * This helps with consistent cache invalidation
 */
export const queryKeys = {
  auth: {
    user: ['auth', 'user'],
    session: ['auth', 'session']
  },
  profile: {
    data: ['profile'],
    settings: ['profile', 'settings']
  },
  points: {
    summary: ['points', 'summary'],
    history: ['points', 'history'],
    transactions: (filters) => ['points', 'transactions', { ...filters }]
  },
  pickups: {
    all: ['pickups'],
    list: (filters) => ['pickups', 'list', { ...filters }],
    detail: (id) => ['pickups', 'detail', id],
    pending: ['pickups', 'pending']
  },
  companies: {
    all: ['companies'],
    list: (filters) => ['companies', 'list', { ...filters }],
    detail: (id) => ['companies', 'detail', id]
  },
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread']
  },
  user: {
    preferences: ['user', 'preferences']
  },
  system: {
    health: ['system', 'health'],
    status: ['system', 'status']
  }
};

/**
 * Helper functions for common cache operations
 */
export const cacheUtils = {
  /**
   * Invalidate all queries with the given key
   * 
   * @param {Array|string} queryKey - Query key to invalidate
   */
  invalidate: (queryKey) => {
    queryClient.invalidateQueries(/** @type {any} */ (queryKey));
  },
  
  /**
   * Update cache data for a specific query
   * 
   * @param {Array|string} queryKey - Query key to update
   * @param {Function|any} updater - Update function or new data
   */
  update: (queryKey, updater) => {
    queryClient.setQueryData(/** @type {any} */ (queryKey), updater);
  },
  
  /**
   * Reset the entire query cache
   */
  resetCache: () => {
    queryClient.resetQueries();
  },
  
  /**
   * Prefetch data for a query
   * 
   * @param {Array|string} queryKey - Query key to prefetch
   * @param {Function} queryFn - Query function
   * @param {Object} options - Additional options
   */
  prefetch: (queryKey, queryFn, options) => {
    (/** @type {any} */ (queryClient)).prefetchQuery(/** @type {any} */ (queryKey), queryFn, options);
  }
};

export default queryClient;