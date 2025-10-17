/**
 * @file lazyLoadTranslations.test.js - اختبارات وحدة لآلية تحميل الترجمات بشكل ديناميكي
 * @module i18n/__tests__/lazyLoadTranslations.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadNamespaceTranslation, loadNamespaces, preloadCommonNamespaces } from '../../lazyLoadTranslations';
import i18n from '../i18n';
import { LANGUAGE_CONSTANTS } from '../../constants';

// محاكاة استيراد الوحدات الديناميكي
vi.mock('../../locales/en/common.js', () => {
  return {
    default: {
      test: 'Test Value',
      nested: { key: 'Nested Value' }
    }
  };
}, { virtual: true });

vi.mock('../../locales/ar/common.js', () => {
  return {
    default: {
      test: 'قيمة اختبارية',
      nested: { key: 'قيمة متداخلة' }
    }
  };
}, { virtual: true });

describe('Lazy Load Translations', () => {
  beforeEach(() => {
    // إعادة تعيين i18n قبل كل اختبار
    vi.spyOn(i18n, 'addResourceBundle').mockImplementation(() => {});
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('en');
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadNamespaceTranslation', () => {
    it('should load a translation namespace for current language', async () => {
      await loadNamespaceTranslation('common');
      
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'en', 'common', expect.any(Object), true, true
      );
    });
    
    it('should load a translation namespace for specified language', async () => {
      await loadNamespaceTranslation('common', 'ar');
      
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'ar', 'common', expect.any(Object), true, true
      );
    });
    
    it('should handle missing translation files gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await loadNamespaceTranslation('nonexistent');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load translations'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should try to load fallback language if translation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('fr');
      
      await loadNamespaceTranslation('nonexistent');
      
      // يجب أن يحاول تحميل اللغة الافتراضية بعد فشل التحميل
      expect(consoleSpy).toHaveBeenCalledTimes(2); // مرة للغة الأصلية ومرة للغة الافتراضية
      
      consoleSpy.mockRestore();
    });
    
    it('should not reload already loaded namespaces', async () => {
      // تحميل الوحدة للمرة الأولى
      await loadNamespaceTranslation('common');
      expect(i18n.addResourceBundle).toHaveBeenCalledTimes(1);
      
      // إعادة تحميل نفس الوحدة
      i18n.addResourceBundle.mockClear();
      await loadNamespaceTranslation('common');
      
      // يجب ألا يتم استدعاء addResourceBundle مرة أخرى
      expect(i18n.addResourceBundle).not.toHaveBeenCalled();
    });
  });

  describe('loadNamespaces', () => {
    it('should load multiple namespaces in parallel', async () => {
      await loadNamespaces(['common', 'dashboard']);
      
      expect(i18n.addResourceBundle).toHaveBeenCalledTimes(2);
    });
    
    it('should handle empty or invalid namespaces array', async () => {
      // مصفوفة فارغة
      await loadNamespaces([]);
      expect(i18n.addResourceBundle).not.toHaveBeenCalled();
      
      // قيمة null
      await loadNamespaces(null);
      expect(i18n.addResourceBundle).not.toHaveBeenCalled();
      
      // قيمة غير مصفوفة
      await loadNamespaces('not an array');
      expect(i18n.addResourceBundle).not.toHaveBeenCalled();
    });
  });

  describe('preloadCommonNamespaces', () => {
    it('should load common namespaces for current language', async () => {
      await preloadCommonNamespaces();
      
      // التحقق من تحميل الوحدات الأساسية
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'en', 'common', expect.any(Object), true, true
      );
      // في الحالة الافتراضية، اللغة الحالية هي نفسها اللغة الافتراضية
      // لذلك لن يتم تحميل اللغة الافتراضية مرة أخرى
      expect(i18n.addResourceBundle).toHaveBeenCalledTimes(3); // common, errors, navigation
    });
    
    it('should also load common namespaces for default language when current language is different', async () => {
      vi.spyOn(i18n, 'language', 'get').mockReturnValue('ar');
      
      await preloadCommonNamespaces();
      
      // التحقق من تحميل الوحدات للغة الحالية
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'ar', 'common', expect.any(Object), true, true
      );
      
      // التحقق من تحميل الوحدات للغة الافتراضية أيضًا
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'en', 'common', expect.any(Object), true, true
      );
      
      // 6 استدعاءات: 3 للغة العربية و 3 للغة الإنجليزية
      expect(i18n.addResourceBundle).toHaveBeenCalledTimes(6);
    });
  });
});