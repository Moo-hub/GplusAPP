/**
 * @file lazyLoadTranslations.js - تحميل ملفات الترجمة بشكل ديناميكي مع تحسينات الأداء
 * @module lazyLoadTranslations
 */

import i18n from './i18n';
import { LANGUAGE_CONSTANTS } from './constants';

// خريطة لتخزين الوحدات التي تم تحميلها بالفعل (التخزين المؤقت في الذاكرة)
const loadedNamespaces = new Map();

// خريطة لتخزين الوعود الجارية لتجنب التحميل المتكرر لنفس الوحدة
const pendingNamespaces = new Map();

// كائن للتخزين المؤقت للترجمات المحملة
const translationCache = {};

// تهيئة التخزين المؤقت
Object.keys(LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES).forEach(lang => {
  translationCache[lang] = {};
});

/**
 * التحقق مما إذا كانت وحدة الترجمة محملة بالفعل
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} language - اللغة المطلوبة
 * @returns {boolean} ما إذا كانت الوحدة محملة بالفعل
 * @private
 */
const isNamespaceLoaded = (namespace, language) => {
  const key = `${namespace}:${language}`;
  return loadedNamespaces.has(key);
};

/**
 * تسجيل وحدة ترجمة كمحملة
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} language - اللغة المحملة
 * @param {Object} resources - موارد الترجمة
 * @private
 */
const markNamespaceAsLoaded = (namespace, language, resources = null) => {
  const key = `${namespace}:${language}`;
  loadedNamespaces.set(key, true);
  
  // تخزين الترجمات في التخزين المؤقت إذا تم توفيرها
  if (resources && language in translationCache) {
    translationCache[language][namespace] = resources;
  }
};

/**
 * الحصول على وعد لتحميل وحدة ترجمة
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} language - اللغة المطلوبة
 * @returns {Promise<void>|null} وعد لتحميل الوحدة أو null إذا لم يكن هناك وعد قيد التنفيذ
 * @private
 */
const getPendingNamespacePromise = (namespace, language) => {
  const key = `${namespace}:${language}`;
  return pendingNamespaces.get(key) || null;
};

/**
 * تسجيل وعد لتحميل وحدة ترجمة
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} language - اللغة المطلوبة
 * @param {Promise<void>} promise - الوعد لتحميل الوحدة
 * @private
 */
const setPendingNamespacePromise = (namespace, language, promise) => {
  const key = `${namespace}:${language}`;
  pendingNamespaces.set(key, promise);
  
  // إزالة الوعد من الخريطة بعد اكتمال التحميل
  promise.finally(() => {
    pendingNamespaces.delete(key);
  });
};

/**
 * محاولة الحصول على الترجمات من التخزين المؤقت
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} language - اللغة المطلوبة
 * @returns {Object|null} موارد الترجمة أو null إذا لم تكن موجودة في التخزين المؤقت
 * @private
 */
const getFromCache = (namespace, language) => {
  return (
    translationCache[language] && 
    translationCache[language][namespace]
  ) || null;
};

/**
 * تحميل وحدة ترجمة محددة بشكل ديناميكي مع تحسينات الأداء
 *
 * @param {string} namespace - اسم وحدة الترجمة (مثل: 'common', 'dashboard', إلخ)
 * @param {string} [language=null] - اللغة المطلوبة، إذا لم يتم تحديدها، يتم تحميل اللغة الحالية
 * @returns {Promise<void>} وعد يتم تنفيذه عند اكتمال التحميل
 */
export const loadNamespaceTranslation = async (namespace, language = null) => {
  const lang = language || i18n.language || LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE;
  
  // التحقق مما إذا كانت الوحدة محملة بالفعل
  if (isNamespaceLoaded(namespace, lang)) {
    return;
  }
  
  // التحقق مما إذا كان هناك وعد قيد التنفيذ لهذه الوحدة
  const pendingPromise = getPendingNamespacePromise(namespace, lang);
  if (pendingPromise) {
    return pendingPromise;
  }
  
  // محاولة الحصول على الترجمات من التخزين المؤقت
  const cachedTranslations = getFromCache(namespace, lang);
  if (cachedTranslations) {
    // إضافة الترجمات من التخزين المؤقت إلى i18n
    i18n.addResourceBundle(lang, namespace, cachedTranslations, true, true);
    markNamespaceAsLoaded(namespace, lang);
    return;
  }
  
  try {
    // إنشاء وعد لتحميل الترجمات
    const loadPromise = (async () => {
      try {
        // تحميل ملف الترجمة بشكل ديناميكي
        const translationModule = await import(`./locales/${lang}/${namespace}.js`);
        const resources = translationModule.default;
        
        // إضافة الترجمات إلى i18n
        i18n.addResourceBundle(lang, namespace, resources, true, true);
        
        // تعليم الوحدة على أنها محملة وتخزينها في التخزين المؤقت
        markNamespaceAsLoaded(namespace, lang, resources);
      } catch (error) {
        console.error(`Failed to load translations for ${namespace} in ${lang}:`, error);
        
        // إذا فشل التحميل، حاول تحميل اللغة الافتراضية كحل بديل
        if (lang !== LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE) {
          await loadNamespaceTranslation(namespace, LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE);
        }
      }
    })();
    
    // تسجيل الوعد في خريطة الوعود الجارية
    setPendingNamespacePromise(namespace, lang, loadPromise);
    
    // انتظار اكتمال التحميل
    await loadPromise;
  } catch (error) {
    console.error(`Error in loadNamespaceTranslation for ${namespace} in ${lang}:`, error);
  }
};

/**
 * تحميل مجموعة من وحدات الترجمة بشكل متوازي مع تحسينات الأداء
 *
 * @param {string[]} namespaces - مصفوفة من أسماء وحدات الترجمة
 * @param {string} [language=null] - اللغة المطلوبة
 * @returns {Promise<void>} وعد يتم تنفيذه عند اكتمال تحميل جميع الوحدات
 */
export const loadNamespaces = async (namespaces, language = null) => {
  if (!namespaces || !Array.isArray(namespaces) || namespaces.length === 0) {
    return;
  }
  
  // تقسيم الوحدات إلى محملة بالفعل وغير محملة
  const lang = language || i18n.language || LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE;
  const notLoadedNamespaces = namespaces.filter(ns => !isNamespaceLoaded(ns, lang));
  
  if (notLoadedNamespaces.length === 0) {
    return;
  }
  
  // تحميل الوحدات غير المحملة بشكل متوازي
  await Promise.all(
    notLoadedNamespaces.map(namespace => loadNamespaceTranslation(namespace, lang))
  );
};

/**
 * تسريع تحميل وحدة ترجمة معينة
 * يمكن استخدام هذه الوظيفة لتسريع تحميل الوحدات المتوقع استخدامها قريبًا
 *
 * @param {string} namespace - اسم وحدة الترجمة
 * @param {string} [language=null] - اللغة المطلوبة
 */
export const prefetchNamespace = (namespace, language = null) => {
  // بدء تحميل الوحدة في الخلفية بدون انتظار اكتمال التحميل
  loadNamespaceTranslation(namespace, language).catch(() => {
    // تجاهل الأخطاء في التحميل المسبق
  });
};

/**
 * تحميل مسبق للوحدات الأساسية
 * يمكن استدعاء هذه الوظيفة عند بدء التطبيق
 */
export const preloadCommonNamespaces = async () => {
  // قائمة بالوحدات الأساسية التي يجب تحميلها مسبقاً
  const commonNamespaces = ['common', 'errors', 'navigation'];
  
  // تحميل الوحدات للغة الحالية
  await loadNamespaces(commonNamespaces);
  
  // إذا كانت اللغة الحالية ليست هي الافتراضية، قم بتحميل الوحدات للغة الافتراضية أيضاً
  const currentLanguage = i18n.language || LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE;
  if (currentLanguage !== LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE) {
    await loadNamespaces(commonNamespaces, LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE);
  }
};

/**
 * مسح التخزين المؤقت للترجمات (مفيد عند تغيير اللغة أو تحديث الترجمات)
 */
export const clearTranslationCache = () => {
  // مسح التخزين المؤقت للترجمات
  Object.keys(translationCache).forEach(lang => {
    translationCache[lang] = {};
  });
  
  // مسح خريطة الوحدات المحملة
  loadedNamespaces.clear();
};

/**
 * تفريغ التخزين المؤقت للترجمات في localStorage لتسريع التحميل في الزيارات اللاحقة
 */
export const persistTranslationCache = () => {
  try {
    // حفظ التخزين المؤقت في localStorage
    localStorage.setItem(
      'i18n_translation_cache',
      JSON.stringify(translationCache)
    );
  } catch (error) {
    console.warn('Failed to persist translation cache to localStorage:', error);
  }
};

/**
 * تحميل التخزين المؤقت للترجمات من localStorage
 */
export const loadPersistedTranslationCache = () => {
  try {
    // محاولة تحميل التخزين المؤقت من localStorage
    const cached = localStorage.getItem('i18n_translation_cache');
    if (cached) {
      const parsedCache = JSON.parse(cached);
      
      // دمج التخزين المؤقت المحمل مع التخزين المؤقت الحالي
      Object.keys(parsedCache).forEach(lang => {
        if (!translationCache[lang]) {
          translationCache[lang] = {};
        }
        
        Object.keys(parsedCache[lang]).forEach(ns => {
          if (parsedCache[lang][ns]) {
            translationCache[lang][ns] = parsedCache[lang][ns];
            
            // تحميل الترجمات مباشرة في i18n
            i18n.addResourceBundle(lang, ns, parsedCache[lang][ns], true, true);
            
            // تعليم الوحدة على أنها محملة
            markNamespaceAsLoaded(ns, lang, parsedCache[lang][ns]);
          }
        });
      });
    }
  } catch (error) {
    console.warn('Failed to load persisted translation cache:', error);
  }
};

// تحميل التخزين المؤقت المحفوظ عند استيراد الوحدة
try {
  loadPersistedTranslationCache();
} catch (e) {
  // تجاهل الأخطاء أثناء التحميل الأولي
}
