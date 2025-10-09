import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

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
        refetchOnWindowFocus: import.meta.env.PROD, // Only in production
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          // Don't retry on 404s and auth errors
          if (error?.response?.status === 404) return false;
          if (error?.response?.status === 401) return false;
          if (error?.response?.status === 403) return false;
          
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        // Show error toasts for query errors
        onError: (error) => {
          if (import.meta.env.DEV) {
            console.error('Query error:', error);
          }
          
          // Only show toast for network errors or unexpected server errors
          if (!error.response || error.response.status >= 500) {
            toast.error(
              error.message || 'An error occurred while fetching data'
            );
          }
        },
        ...options?.queries
      },
      mutations: {
        // Retry mutations once by default
        retry: 1,
        // Show error toasts for mutation errors
        onError: (error, variables, context) => {
          if (import.meta.env.DEV) {
            console.error('Mutation error:', error, { variables, context });
          }
          
          toast.error(
            error.response?.data?.message || 
            error.message || 
            'An error occurred while saving data'
          );
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
    queryClient.invalidateQueries(queryKey);
  },
  
  /**
   * Update cache data for a specific query
   * 
   * @param {Array|string} queryKey - Query key to update
   * @param {Function|any} updater - Update function or new data
   */
  update: (queryKey, updater) => {
    queryClient.setQueryData(queryKey, updater);
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
    queryClient.prefetchQuery(queryKey, queryFn, options);
  }
};

export default queryClient;