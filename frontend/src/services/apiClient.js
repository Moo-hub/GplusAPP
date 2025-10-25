import axios from 'axios';
import { toast } from 'react-toastify';

// إنشاء نسخة من axios مع الإعدادات الافتراضية
// Prefer a relative /api base when running tests (Vitest) so MSW
// intercepts calls and we don't hit the real backend. Otherwise
// fall back to the configured VITE_API_URL or '/api'.
let resolvedBaseURL = '/api';
try {
  if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
    // In Vitest/node prefer an explicit loopback host so axios/http adapter
    // produces an absolute URL using 'localhost' which our MSW handlers
    // match reliably. This avoids platform-specific IPv6 bracketed hosts.
    resolvedBaseURL = 'http://localhost';
  } else {
    // Safe resolution for Vite's env without referencing `import.meta` which
    // can cause type/compile errors in some TS configurations. Prefer
    // process.env.VITE_API_URL when available (set by CI/build), then a
    // runtime global shim (globalThis.__VITE_API_URL__), then default '/api'.
    const fromProcess = (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) ? process.env.VITE_API_URL : null;
    const fromGlobal = (typeof globalThis !== 'undefined' && globalThis.__VITE_API_URL__) ? globalThis.__VITE_API_URL__ : null;
    if (fromProcess) resolvedBaseURL = fromProcess;
    else if (fromGlobal) resolvedBaseURL = fromGlobal;
    else resolvedBaseURL = '/api';
  }
} catch (e) {
  void e;
  try { const { error } = require('../utils/logger'); error('apiClient init resolution error', e); } catch (_) { void _; }
}

const apiClient = axios.create({
  baseURL: resolvedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export the resolved base URL so services can construct absolute URLs
export const API_URL = resolvedBaseURL;

// Helper to produce an Authorization header object used by some services
export function authHeader() {
  try {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    // localStorage may be unavailable in some test runners; return empty object
    return {};
  }
}

// Force Node HTTP adapter in test environments (Vitest/jsdom) so
// msw's setupServer can intercept requests made through this client.
try {
  // eslint-disable-next-line global-require
  const requireCjs = eval('require');
  const httpAdapter = requireCjs('axios/lib/adapters/http');
  if (httpAdapter && apiClient && apiClient.defaults) {
    apiClient.defaults.adapter = httpAdapter;
  }
} catch (e) {
  // ignore if adapter path isn't available or in browser env
}

// اعتراض الطلبات للتعامل مع الرموز المميزة
apiClient.interceptors.request.use(
  async (config) => {
    // If tests expose a readiness promise for MSW, await it so handlers
    // are guaranteed to be registered before any request is sent. This
    // prevents races where axios (created at module init) issues a
    // request before msw handlers are attached, causing ECONNREFUSED.
    try {
      if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
        const ready = (typeof globalThis !== 'undefined' && globalThis.__MSW_SERVER_READY) || (typeof global !== 'undefined' && global.__MSW_SERVER_READY);
        if (ready && typeof ready.then === 'function') {
          try { await ready; } catch (e) { /* ignore readiness errors */ }
        }
      }
  } catch (e) { void e; }

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // localStorage may be unavailable in some worker contexts
    }

    // Debugging: in Vitest show the fully-resolved URL so we can patch
    // MSW predicate handlers to match the exact shape (IPv6 vs bracketed).
    try {
      if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
        const debug = (typeof globalThis !== 'undefined' && globalThis.__MSW_DEBUG__) || process.env.MSW_DEBUG;
        if (debug) {
          try {
            const base = config.baseURL || 'http://localhost';
            // If config.url is absolute, URL will use it; otherwise resolve against base
            const finalUrl = new URL(config.url, base).toString();
            // eslint-disable-next-line no-console
            try { const { debug } = require('../utils/logger'); debug('MSW-DEBUG: apiClient request ->', { method: config.method, base, url: config.url, finalUrl, headers: config.headers }); } catch (e) { void e; }
          } catch (e) {
            // ignore URL parse errors
          }
        }
      }
  } catch (e) { void e; }
    return config;
  },
  (error) => Promise.reject(error)
);

// اعتراض الاستجابات للتعامل مع الأخطاء
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // تحضير رسالة الخطأ
    let errorMessage = 'حدث خطأ غير متوقع';
    
    if (response) {
      // التعامل مع أخطاء HTTP المعروفة
      switch (response.status) {
        case 400:
          errorMessage = response.data.message || 'طلب غير صالح';
          break;
        case 401:
          errorMessage = 'غير مصرح لك بالوصول';
          // يمكن تنفيذ تسجيل الخروج هنا
          break;
        case 403:
          errorMessage = 'غير مسموح لك بهذا الإجراء';
          break;
        case 404:
          errorMessage = 'المورد المطلوب غير موجود';
          break;
        case 500:
          errorMessage = 'خطأ في الخادم';
          break;
        default:
          errorMessage = `حدث خطأ (${response.status})`;
      }
    } else if (error.request) {
      // الطلب تم إرساله لكن لم يتم استلام استجابة
      errorMessage = 'لا يمكن الاتصال بالخادم';
    }
    
    // إظهار إشعار الخطأ
    toast.error(errorMessage, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // إعادة رفض الخطأ للتعامل معه في المكونات
    return Promise.reject(error);
  }
);

export default apiClient;