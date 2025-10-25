import React from 'react';
import { 
  QueryClient, 
  QueryClientProvider
} from '@tanstack/react-query';
// Avoid static import of ReactQueryDevtools so Vite's import-analysis
// doesn't fail during tests when the package is not available. Use a
// guarded runtime require to keep this import conditional.
let ReactQueryDevtools = null;
try {
  // eslint-disable-next-line global-require
  const _dev = require('@tanstack/react-query-devtools');
  ReactQueryDevtools = _dev && _dev.ReactQueryDevtools ? _dev.ReactQueryDevtools : null;
} catch (e) {
  // ignore — devtools not installed in this environment
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Add React Query Devtools - only in development */}
      {import.meta.env.DEV && ReactQueryDevtools ? (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      ) : null}
    </QueryClientProvider>
  );
};

// Export the query client instance for direct access when needed
export { queryClient };