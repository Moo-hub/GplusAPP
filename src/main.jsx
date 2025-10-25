import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Avoid static import of ReactQueryDevtools so Vite's import-analysis
// (which runs before test setup files) doesn't fail when the package
// isn't present in the test environment. We'll attempt a guarded
// runtime require and render the devtools only when available.
let ReactQueryDevtools = null;
try {
  // Use require inside try/catch so this doesn't become a static ESM import.
  // In environments without `require` this will throw and be ignored.
  // eslint-disable-next-line global-require
  const _dev = require('@tanstack/react-query-devtools');
  ReactQueryDevtools = _dev && _dev.ReactQueryDevtools ? _dev.ReactQueryDevtools : null;
} catch (e) {
  // devtools not available — that's fine for tests or production builds
}
import App from './App';
import './index.css';
import './styles/colors.css';
import './styles/forms.css';
import './styles/responsive.css';
import './styles/mobile-utils.css';
import './i18n'; // Import i18n configuration
import { applyDeviceClasses, addOrientationChangeListener } from './utils/responsive';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize responsive utilities
applyDeviceClasses();
addOrientationChangeListener(({ isPortrait }) => {
  console.log(`Orientation changed: ${isPortrait ? 'portrait' : 'landscape'}`);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  </React.StrictMode>
);
