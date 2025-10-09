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
      console.error('Analytics error: no API URL configured');
      return;
    }

    const body = JSON.stringify({ ...payload, appVersion: getAppVersion() });

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(`${apiUrl}/analytics/events`, body);
        return;
      }

      if (typeof fetch === 'function') {
        fetch(`${apiUrl}/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch((err) => console.error('Analytics error (fetch):', err));
        return;
      }

      console.error('Analytics error: no transport available to send analytics');
    } catch (err) {
      console.error('Analytics error:', err);
    }
  } else {
    // In non-production (development/test) we emit a diagnostic log so
    // tests and local debugging can observe analytics events without
    // hitting the network. Tests assert this console output directly.
    try {
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log('Analytics Event:', payload);
      }
    } catch (err) {
      // swallow logging errors to avoid failing the caller
    }
  }
};

export const Analytics = {
  pageView: (pageName, path) => sendAnalyticsEvent({ eventType: 'page_view', pageName, path }),
  trackEvent: (category, action, label = null, value = null) => sendAnalyticsEvent({ eventType: 'user_action', category, action, label, value }),
  trackError: (errorMessage, errorSource, isFatal = false) => sendAnalyticsEvent({ eventType: 'error', errorMessage, errorSource, isFatal }),
  trackPerformance: (metric, value) => sendAnalyticsEvent({ eventType: 'performance', metric, value })
};