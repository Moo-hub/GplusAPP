import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// موارد الترجمة المستخدمة في الاختبارات
const resources = {
  en: {
    common: {
      appName: 'GplusApp',
      welcome: 'Welcome to GplusApp',
      selectLanguage: 'Select language',
      changeLanguage: 'Change language to {{language}}',
      languages: {
        english: 'English',
        arabic: 'Arabic'
      },
      pages: {
        home: 'Home',
        products: 'Products',
        about: 'About Us',
        login: 'Login',
        register: 'Register',
        dashboard: 'Dashboard'
      }
    },
    auth: {
      login: 'Login',
      loginButton: 'Sign In',
      logout: 'Sign Out',
      register: 'Register'
    },
    products: {
      product1: 'Product 1',
      product2: 'Product 2',
      detail: 'Product Details: {{id}}',
      description: 'This is product {{id}} description'
    },
    about: {
      content: 'About us content'
    },
    dashboard: {
      welcome: 'Welcome to your dashboard'
    }
  },
  ar: {
    common: {
      appName: 'جي بلس',
      welcome: 'مرحبًا بك في جي بلس',
      selectLanguage: 'اختر اللغة',
      changeLanguage: 'تغيير اللغة إلى {{language}}',
      languages: {
        english: 'الإنجليزية',
        arabic: 'العربية'
      },
      pages: {
        home: 'الرئيسية',
        products: 'المنتجات',
        about: 'من نحن',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        dashboard: 'لوحة التحكم'
      }
    },
    auth: {
      login: 'تسجيل الدخول',
      loginButton: 'دخول',
      logout: 'تسجيل خروج',
      register: 'إنشاء حساب'
    },
    products: {
      product1: 'المنتج 1',
      product2: 'المنتج 2',
      detail: 'تفاصيل المنتج: {{id}}',
      description: 'هذا وصف المنتج رقم {{id}}'
    },
    about: {
      content: 'محتوى من نحن'
    },
    dashboard: {
      welcome: 'مرحبًا بك في لوحة التحكم'
    }
  }
};

// تهيئة i18n للاختبارات
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'auth', 'products', 'about', 'dashboard'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false // عدم هروب القيم HTML في الترجمات
    }
  });

export default i18n;