/**
 * @file i18n.js - تكوين وتهيئة الترجمة متعددة اللغات للتطبيق
 * @module frontend/i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// إنشاء موارد الترجمة مباشرة
const resources = {
  en: {
    translation: {
      app: {
        title: "G+ Recycling App"
      },
      nav: {
        dashboard: "Dashboard",
        points: "My Points",
        pickups: "Pickups",
        companies: "Companies",
        profile: "Profile"
      },
      dashboard: {
        welcome: "Welcome to G+ Dashboard",
        pointsBalance: "Points Balance",
        viewPoints: "View Points",
        pickupRequests: "Pickup Requests",
        schedulePickup: "Schedule Pickup",
        scheduleNow: "Schedule Now",
        environmentalImpact: "Environmental Impact",
        checkImpact: "Check Impact",
        viewImpact: "View Impact"
      },
      auth: {
        welcome: "Welcome",
        login: "Login",
        register: "Register",
        email: "Email",
        password: "Password",
        logout: "Logout"
      },
      pickup: {
        title: "Request Pickup",
        scheduleNew: "Schedule New Pickup",
        noRequests: "No pickup requests found",
        scheduleFirst: "Schedule your first pickup",
        newRequest: "New Pickup Request",
        selectMaterials: "Select Materials",
        weightEstimate: "Weight Estimate (kg)",
        pickupDate: "Pickup Date",
        address: "Pickup Address",
        submit: "Submit Request"
      },
      materials: {
        plastic: "Plastic",
        paper: "Paper",
        glass: "Glass",
        metal: "Metal",
        electronics: "Electronics"
      },
      points: {
        title: "Points",
        summary: "Points Summary",
        balance: "Balance",
        impact: "Environmental Impact",
        reward: "Reward",
        monthly: "This Month",
        streak: "Day Streak",
        days: "days",
        history: "Points History",
        noHistoryAvailable: "No history available"
      },
      profile: {
        title: "Profile",
        name: "Name",
        email: "Email"
      },
      common: {
        loading: "Loading...",
        cancel: "Cancel"
      },
      errors: {
        dataLoadingError: "Failed to load data",
        tryAgainLater: "Please try again later"
      }
    }
  },
  ar: {
    translation: {
      app: {
        title: "تطبيق G+ لإعادة التدوير"
      },
      nav: {
        dashboard: "لوحة التحكم",
        points: "نقاطي",
        pickups: "طلبات الالتقاط",
        companies: "الشركات",
        profile: "الملف الشخصي"
      },
      dashboard: {
        welcome: "مرحباً بك في لوحة تحكم G+",
        pointsBalance: "رصيد النقاط",
        viewPoints: "عرض النقاط",
        pickupRequests: "طلبات الالتقاط",
        schedulePickup: "جدولة الالتقاط",
        scheduleNow: "جدولة الآن",
        environmentalImpact: "التأثير البيئي",
        checkImpact: "فحص التأثير",
        viewImpact: "عرض التأثير"
      },
      auth: {
        welcome: "مرحباً",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        logout: "تسجيل الخروج"
      },
      pickup: {
        title: "طلب التقاط",
        scheduleNew: "جدولة التقاط جديد",
        noRequests: "لا توجد طلبات التقاط",
        scheduleFirst: "جدولة أول التقاط لك",
        newRequest: "طلب التقاط جديد",
        selectMaterials: "اختيار المواد",
        weightEstimate: "تقدير الوزن (كيلو)",
        pickupDate: "تاريخ الالتقاط",
        address: "عنوان الالتقاط",
        submit: "إرسال الطلب"
      },
      materials: {
        plastic: "البلاستيك",
        paper: "الورق",
        glass: "الزجاج",
        metal: "المعادن",
        electronics: "الإلكترونيات"
      },
      points: {
        title: "النقاط",
        summary: "ملخص النقاط",
        balance: "الرصيد",
        impact: "التأثير البيئي",
        reward: "المكافأة",
        monthly: "هذا الشهر",
        streak: "أيام متتالية",
        days: "أيام",
        history: "سجل النقاط",
        noHistoryAvailable: "لا يوجد سجل متاح"
      },
      profile: {
        title: "الملف الشخصي",
        name: "الاسم",
        email: "البريد الإلكتروني"
      },
      common: {
        loading: "جاري التحميل...",
        cancel: "إلغاء"
      },
      errors: {
        dataLoadingError: "فشل في تحميل البيانات",
        tryAgainLater: "يرجى المحاولة مرة أخرى لاحقاً"
      }
    }
  }
};

// اللغات المدعومة في التطبيق
export const supportedLanguages = ['en', 'ar'];

// تهيئة مكتبة i18n
i18n
  // اكتشاف لغة المستخدم
  .use(LanguageDetector)
  // تمرير مثيل i18n إلى react-i18next
  .use(initReactI18next)
  // تهيئة الإعدادات
  .init({
    resources,
    fallbackLng: 'en',
    // تفعيل وضع التصحيح في بيئة التطوير فقط
    debug: process.env.NODE_ENV === 'development',
    // إعدادات الاستيفاء
    interpolation: {
      escapeValue: false // React يحمي من هجمات XSS
    },
    // إعدادات اكتشاف اللغة وتخزينها
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nLanguage',
    },
    // إعدادات واجهة React
    react: {
      useSuspense: true,
      transSupportBasicHtmlNodes: true,
    },
    // التعامل مع القيم المفقودة
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
      }
    }
  });

// وظيفة مساعدة لتغيير اللغة برمجياً
export const changeLanguage = (lng) => {
  if (supportedLanguages.includes(lng)) {
    return i18n.changeLanguage(lng);
  }
  console.warn(`Language ${lng} is not supported. Using fallback language.`);
  return i18n.changeLanguage('en');
};

// وظيفة مساعدة للتحقق من اتجاه النص بناءً على اللغة الحالية
export const isRTL = () => {
  const currentLanguage = i18n.language || 'en';
  return ['ar', 'he', 'ur'].includes(currentLanguage);
};

// وظيفة مساعدة لاختبار وجود ترجمة لمفتاح معين
export const hasTranslation = (key) => {
  return i18n.exists(key);
};

// تصدير كائن i18n كافتراضي
export default i18n;