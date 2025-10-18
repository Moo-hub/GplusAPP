import axios from 'axios';
import { toast } from 'react-toastify';

// إنشاء نسخة من axios مع الإعدادات الافتراضية
// Prefer a relative /api base when running tests (Vitest) so MSW
// intercepts calls and we don't hit the real backend. Otherwise
// fall back to the configured VITE_API_URL or '/api'.
let resolvedBaseURL = '/api';
try {
  if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
    resolvedBaseURL = '/api';
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    resolvedBaseURL = import.meta.env.VITE_API_URL;
  }
} catch (e) {
  // ignore and keep default
}

const apiClient = axios.create({
  baseURL: resolvedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_URL so other services can build full paths in a consistent way.
export const API_URL = resolvedBaseURL;

// Simple helper to produce Authorization headers when a token is present.
export const authHeader = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {}
  return {};
};

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
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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