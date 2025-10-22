// Analytics service using runtime globals for testability.

let sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const getRuntimeEnv = () => {
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_APP_ENVIRONMENT) return globalThis.__VITE_APP_ENVIRONMENT;
  return 'development';
};

const getApiUrl = () => {
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_API_URL) return globalThis.__VITE_API_URL;
  return '';
};

const getAppVersion = () => {
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_APP_VERSION) return globalThis.__VITE_APP_VERSION;
  return undefined;
};

const sendAnalyticsEvent = (eventData) => {
  const currentUserAgent = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'unknown';
  const currentScreenSize = (typeof window !== 'undefined' && window.screen) ? `${window.screen.width}x${window.screen.height}` : '0x0';

  const runtimeEnv = getRuntimeEnv();

  const payload = {
    ...eventData,
    sessionId,
    userAgent: currentUserAgent,
    screenSize: currentScreenSize,
    timestamp: new Date().toISOString()
  };

  if (runtimeEnv === 'production') {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      try { require('../utils/logger').error('Analytics error: no API URL configured'); } catch (e) { void e; }
      return;
    }

    const body = { ...payload, appVersion: getAppVersion() };

      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          try {
            navigator.sendBeacon(`${apiUrl}/analytics/events`, JSON.stringify(body));
          } catch (e) {
            try { require('../utils/logger').error('Analytics error:', e instanceof Error ? e : new Error(String(e))); } catch (ee) { void ee; }
          }
          return;
        }

      // Prefer centralized axios client so MSW and test interceptors are used.
      try {
        // Lazy-import to avoid circular imports during test bootstrap
        import('./apiClient.js').then(({ default: apiClient }) => {
          try {
            apiClient.post(`${apiUrl.replace(/\/$/, '')}/analytics/events`, body).catch((err) => {
              try { require('../utils/logger').error('Analytics error (apiClient):', err && err.message ? err.message : err); } catch (e) { void e; }
            });
          } catch (e) {
            try { require('../utils/logger').error('Analytics error (apiClient invoke):', e && e.message ? e.message : e); } catch (ee) { void ee; }
          }
        }).catch((err) => {
          try { require('../utils/logger').error('Analytics error: failed to import apiClient', err && err.message ? err.message : err); } catch (e) { void e; }
        });
        return;
      } catch (err) {
    try { require('../utils/logger').error('Analytics error (import fallback):', err && err.message ? err.message : err); } catch (e) { void e; }
      }
  try { require('../utils/logger').error('Analytics error: no transport available to send analytics'); } catch (e) { void e; }
    } catch (err) {
      try { require('../utils/logger').error('Analytics error:', err && err.message ? err.message : err); } catch (e) { void e; }
    }
  } else {
    // In non-production (development/test) we emit a diagnostic log so
    // tests and local debugging can observe analytics events without
    // hitting the network. Tests assert this console output directly.
    try {
      const { debug } = require('../utils/logger');
      debug('Analytics Event:', payload);
    } catch (err) {
      void err;
    }
  }
};

export const Analytics = {
  pageView: (pageName, path) => sendAnalyticsEvent({ eventType: 'page_view', pageName, path }),
  trackEvent: (category, action, label = null, value = null) => sendAnalyticsEvent({ eventType: 'user_action', category, action, label, value }),
  trackError: (errorMessage, errorSource, isFatal = false) => sendAnalyticsEvent({ eventType: 'error', errorMessage, errorSource, isFatal }),
  trackPerformance: (metric, value) => sendAnalyticsEvent({ eventType: 'performance', metric, value })
};