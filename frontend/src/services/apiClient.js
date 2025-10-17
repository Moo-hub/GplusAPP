import axios from 'axios';
import { toast } from 'react-toastify';

// Normalize base URL to always include '/api/v1'
function normalizeBaseURL(raw) {
  const fallback = 'http://localhost:8000/api/v1';
  let url = (raw && typeof raw === 'string') ? raw.trim() : fallback;

  if (url.endsWith('/api/v1')) return url;
  if (url.endsWith('/api/')) return url + 'v1';
  if (url.endsWith('/api')) return url + '/v1';
  if (url.includes('/api') && !url.includes('/api/v1')) {
    if (url.endsWith('/')) return url + 'api/v1';
    return url + '/api/v1';
  }
  if (url.endsWith('/')) return url + 'api/v1';
  return url + '/api/v1';
}

function getViteApiUrl() {
  try {
    // @ts-ignore - provided by Vite at runtime
    return import.meta && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : undefined;
  } catch (_) {
    return undefined;
  }
}

// إنشاء نسخة من axios مع الإعدادات الافتراضية
const apiClient = axios.create({
  // Ensure baseURL always targets local API v1 when developing
  // @ts-ignore - Vite provides import.meta.env
  baseURL: normalizeBaseURL(getViteApiUrl()),
  headers: {
    'Content-Type': 'application/json',
  },
});

// اعتراض الطلبات للتعامل مع الرموز المميزة
apiClient.interceptors.request.use(
  (config) => {
    // Rewrite legacy login path to correct API v1
    if (config.url === '/auth/login') {
      config.url = '/api/v1/auth/login';
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Transform FormData to URLSearchParams for login to ensure x-www-form-urlencoded
    if (config.url && config.url.endsWith('/auth/login') && config.method === 'post') {
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        const usp = new URLSearchParams();
        config.data.forEach((value, key) => {
          const str = typeof value === 'string' ? value : String(value);
          usp.append(key, str);
        });
        config.data = usp;
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    // Temporary debug: log outgoing login requests
    if (config.url && config.url.includes('/auth/login')) {
      // eslint-disable-next-line no-console
      console.log('[apiClient] Sending', config.method?.toUpperCase(), 'to', (config.baseURL || '') + config.url, 'CT:', config.headers['Content-Type']);
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