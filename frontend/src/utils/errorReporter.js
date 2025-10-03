/**
 * Error tracking and monitoring utilities
 * Can be connected to services like Sentry, LogRocket, or custom error tracking
 */

// Flag to prevent duplicate error reporting
let isErrorReporterInitialized = false;

/**
 * Initialize the error reporter service
 * @param {Object} options - Configuration options
 */
export const initErrorReporting = (options = {}) => {
  if (isErrorReporterInitialized) return;
  
  try {
    // Here you would initialize your error tracking service
    // Example for Sentry:
    // if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    //   Sentry.init({
    //     dsn: import.meta.env.VITE_SENTRY_DSN,
    //     integrations: [
    //       new Sentry.BrowserTracing(),
    //       new Sentry.Replay(),
    //     ],
    //     environment: import.meta.env.MODE,
    //     release: import.meta.env.VITE_APP_VERSION,
    //     ...options
    //   });
    // }

    // Create a global error reporter object that components can access
    window.errorReporter = {
      captureException: (error, context = {}) => {
        // In development, just log to console
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Error Reporter]', error, context);
          return;
        }

        // In production, send to monitoring service
        // Example: Sentry.captureException(error, { extra: context });
        
        // For now, just log to console in production too
        console.error('[Error Reporter]', error, context);
      },
      
      captureMessage: (message, level = 'error', context = {}) => {
        // In development, just log to console
        if (process.env.NODE_ENV !== 'production') {
          console[level]('[Error Reporter]', message, context);
          return;
        }

        // In production, send to monitoring service
        // Example: Sentry.captureMessage(message, { level, extra: context });
        
        // For now, just log to console in production too
        console[level]('[Error Reporter]', message, context);
      },
      
      setUser: (user) => {
        // Example: Sentry.setUser(user);
  // diagnostic suppressed: Set user
      }
    };

    isErrorReporterInitialized = true;
  } catch (error) {
    console.error('Failed to initialize error reporting:', error);
  }
};

/**
 * Global error handler for uncaught errors
 * @param {ErrorEvent} event - The error event
 */
export const setupGlobalErrorHandler = () => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    if (window.errorReporter) {
      window.errorReporter.captureException(event.error || new Error(event.message), {
        source: 'window.onerror',
        line: event.lineno,
        column: event.colno,
        filename: event.filename
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (window.errorReporter) {
      window.errorReporter.captureException(event.reason || new Error('Unhandled Promise rejection'), {
        source: 'unhandledrejection',
        promise: event.promise
      });
    }
  });

  // Handle API errors (emitted by our API service)
  window.addEventListener('api-error', (event) => {
    if (window.errorReporter && event.detail?.error?.response?.status >= 500) {
      window.errorReporter.captureException(event.detail.error, {
        source: 'api-error',
        endpoint: event.detail.endpoint,
        method: event.detail.method
      });
    }
  });
};

/**
 * Track performance metrics for monitoring
 * @param {string} name - Metric name
 * @param {Function} fn - Function to measure
 * @param {Object} context - Additional context
 * @returns {Promise<any>} - Return value of the measured function
 */
export const trackPerformance = async (name, fn, context = {}) => {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    // Log performance metric
    if (duration > 500) { // Only log slow operations
      console.info(`[Performance] ${name}: ${duration.toFixed(2)}ms`, context);
      
      // Send to monitoring in production
      if (process.env.NODE_ENV === 'production' && window.errorReporter) {
        window.errorReporter.captureMessage(
          `Performance: ${name} took ${duration.toFixed(2)}ms`,
          'info',
          { ...context, duration }
        );
      }
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Log error with performance context
    if (window.errorReporter) {
      window.errorReporter.captureException(error, {
        ...context,
        operation: name,
        duration
      });
    }
    
    throw error;
  }
};

export default {
  initErrorReporting,
  setupGlobalErrorHandler,
  trackPerformance
};