import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
