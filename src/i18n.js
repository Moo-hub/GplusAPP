/**
 * @file i18n.js - تكوين وتهيئة الترجمة متعددة اللغات للتطبيق
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// استيراد ملفات الترجمة - نستخدم ملفات JS بدلاً من JSON لتجنب مشاكل التكوين
import translationEN from './i18n/locales/en.js';
import translationAR from './i18n/locales/ar.js';

// تكوين موارد الترجمة للغات المدعومة
const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
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

export default i18n;