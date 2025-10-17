// وحدة خدمات التحليلات

// معلومات الجلسة (تُحسب عند الحاجة لضمان إمكانية الاختبار)
let sessionId = null;
let __testEnv = null;

const getContext = () => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  const userAgent = navigator.userAgent;
  // استخدم innerWidth/innerHeight أولاً لضمان الاتساق في jsdom، ثم screen كـ fallback
  const w = window.innerWidth || ((window.screen && window.screen.width) || 0);
  const h = window.innerHeight || ((window.screen && window.screen.height) || 0);
  const screenSize = `${w}x${h}`;
  return { sessionId, userAgent, screenSize };
};

// إرسال الأحداث إلى الخادم
const sendAnalyticsEvent = (eventData) => {
  const { sessionId: sid, userAgent, screenSize } = getContext();

  // في بيئة الإنتاج، سيتم إرسال البيانات إلى خادم التحليلات
  // في بيئة التطوير، سنسجلها فقط في وحدة التحكم
  
  // تحديد البيئة بطريقة متوافقة مع ESM و CJS
  let viteEnv = {};
  try {
    // محاولة الحصول على متغيرات البيئة من Vite أو من وحدة العامة
    viteEnv = (globalThis.__VITE_ENV || {});
    
    // محاولة الوصول إلى import.meta إذا كان متاحًا (ESM فقط)
    if (typeof process === 'undefined' && typeof window !== 'undefined') {
      // @ts-ignore - نتجاهل خطأ TypeScript لأن هذا يعمل في ESM فقط
      const meta = globalThis.import?.meta;
      if (meta && meta.env) {
        viteEnv = meta.env;
      }
    }
  } catch (e) {
    console.warn('Error accessing environment variables:', e);
  }
  
  const env = (__testEnv?.env) ?? viteEnv.VITE_APP_ENVIRONMENT ?? process.env.NODE_ENV;
  const apiUrl = (__testEnv?.apiUrl) ?? viteEnv.VITE_API_URL ?? '';
  const appVersion = (__testEnv?.appVersion) ?? viteEnv.VITE_APP_VERSION ?? 'test';
  if (env === 'production') {
    // يمكن استخدام Fetch أو إرسالها عبر Beacon API
    try {
      navigator.sendBeacon(
        `${apiUrl}/analytics/events`,
        JSON.stringify({
          ...eventData,
          sessionId: sid,
          userAgent,
          screenSize,
          timestamp: new Date().toISOString(),
          appVersion,
        })
      );
    } catch (error) {
      console.error('Analytics error:', error);
    }
  } else {
    console.log('Analytics Event:', {
      ...eventData,
      sessionId: sid,
      userAgent,
      screenSize,
      timestamp: new Date().toISOString(),
    });
  }
};

// Hook للمساعدة في الاختبارات لإعادة تعيين حالة الجلسة
export const __resetAnalyticsForTest = () => {
  sessionId = null;
  __testEnv = null;
};

export const __setAnalyticsEnvForTest = (env, apiUrl, appVersion) => {
  __testEnv = { env, apiUrl, appVersion };
};

// تصدير الوظائف العامة
export const Analytics = {
  // تسجيل مشاهدة الصفحة
  pageView: (pageName, path) => {
    sendAnalyticsEvent({
      eventType: 'page_view',
      pageName,
      path
    });
  },
  
  // تسجيل تفاعل المستخدم
  trackEvent: (category, action, label = null, value = null) => {
    sendAnalyticsEvent({
      eventType: 'user_action',
      category,
      action,
      label,
      value
    });
  },
  
  // تسجيل خطأ
  trackError: (errorMessage, errorSource, isFatal = false) => {
    sendAnalyticsEvent({
      eventType: 'error',
      errorMessage,
      errorSource,
      isFatal
    });
  },
  
  // تسجيل أداء التطبيق
  trackPerformance: (metric, value) => {
    sendAnalyticsEvent({
      eventType: 'performance',
      metric,
      value
    });
  }
};