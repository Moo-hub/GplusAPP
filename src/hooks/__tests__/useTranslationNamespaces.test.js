/**
 * @file useTranslationNamespaces.test.js - اختبارات وحدة لهوك استخدام وحدات الترجمة
 * @module hooks/__tests__/useTranslationNamespaces.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import useTranslationNamespaces from '../useTranslationNamespaces';
import * as lazyLoadTranslationsModule from '../../lazyLoadTranslations';
import * as i18nSetupModule from '../../i18nSetup';
import { useTranslation } from 'react-i18next';

// محاكاة الوحدات المستخدمة
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn()
}));

vi.mock('../../lazyLoadTranslations', () => ({
  loadNamespaces: vi.fn().mockResolvedValue()
}));

vi.mock('../../i18nSetup', () => ({
  useLanguage: vi.fn()
}));

describe('useTranslationNamespaces hook', () => {
  beforeEach(() => {
    // إعداد القيم الافتراضية للمحاكاة
    useTranslation.mockReturnValue({
      t: (key) => key,
      i18n: { language: 'en' },
      ready: true
    });
    
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'en',
      direction: 'ltr'
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call loadNamespaces with correct parameters for single namespace', async () => {
    renderHook(() => useTranslationNamespaces('common'));
    
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common'], 'en');
  });
  
  it('should call loadNamespaces with correct parameters for multiple namespaces', async () => {
    renderHook(() => useTranslationNamespaces(['common', 'dashboard']));
    
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common', 'dashboard'], 'en');
  });
  
  it('should load fallback translations for default language when specified', async () => {
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'ar',
      direction: 'rtl'
    });
    
    renderHook(() => useTranslationNamespaces('common', { fallback: true }));
    
    // يجب أن يتم تحميل الترجمات للغة الحالية
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common'], 'ar');
    
    // يجب أن يتم تحميل الترجمات للغة الافتراضية أيضًا
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common'], 'en');
  });
  
  it('should not load fallback translations when disabled', async () => {
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'ar',
      direction: 'rtl'
    });
    
    renderHook(() => useTranslationNamespaces('common', { fallback: false }));
    
    // يجب أن يتم تحميل الترجمات للغة الحالية فقط
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common'], 'ar');
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledTimes(1);
  });
  
  it('should return the same object as useTranslation', async () => {
    const translationObject = {
      t: vi.fn(),
      i18n: { language: 'en' },
      ready: true
    };
    
    useTranslation.mockReturnValue(translationObject);
    
    const { result } = renderHook(() => useTranslationNamespaces('common'));
    
    expect(result.current).toEqual(translationObject);
  });
  
  it('should reload translations when language changes', async () => {
    // إعداد محاكاة تغيير اللغة
    let languageChangeCallback;
    const useEffectSpy = vi.spyOn(React, 'useEffect');
    
    useEffectSpy.mockImplementation((callback, deps) => {
      if (deps.includes('language')) {
        languageChangeCallback = callback;
      }
    });
    
    // الاستدعاء الأول بلغة en
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'en',
      direction: 'ltr'
    });
    
    renderHook(() => useTranslationNamespaces('common'));
    
    // تغيير اللغة إلى ar
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'ar',
      direction: 'rtl'
    });
    
    if (languageChangeCallback) {
      languageChangeCallback();
    }
    
    // التحقق من إعادة تحميل الترجمات بعد تغيير اللغة
    expect(lazyLoadTranslationsModule.loadNamespaces).toHaveBeenCalledWith(['common'], 'ar');
  });
});