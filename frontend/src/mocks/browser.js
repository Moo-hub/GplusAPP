import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

// Override the default worker start method to handle errors gracefully
const originalStart = worker.start;
worker.start = async function(options = {}) {
  try {
    return await originalStart.call(this, {
      onUnhandledRequest: 'warn',  // Changed from bypass to warn
      quiet: false,  // Show MSW logs
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      ...options
    });
  } catch (error) {
    console.warn('MSW failed to start:', error);
    return null;
  }
};