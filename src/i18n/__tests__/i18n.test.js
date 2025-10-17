/**
 * @file i18n.test.js - اختبارات وحدة لنظام الترجمة الأساسي
 * @module i18n/__tests__/i18n.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18n, { changeLanguage, isRTL, hasTranslation } from '../i18n';
import { LANGUAGE_CONSTANTS, CUSTOM_EVENTS } from '../../constants';

describe('i18n core functionality', () => {
  // إعداد المحاكاة (mock) لكائن window لاختبار أحداث المتصفح
  const originalAddEventListener = window.addEventListener;
  const originalDispatchEvent = window.dispatchEvent;
  
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    window.addEventListener = vi.fn();
    window.dispatchEvent = vi.fn();
    
    // إعادة تعيين لغة i18n إلى الإنجليزية
    i18n.changeLanguage('en');
  });
  
  afterEach(() => {
    // إعادة الدوال الأصلية بعد كل اختبار
    window.addEventListener = originalAddEventListener;
    window.dispatchEvent = originalDispatchEvent;
    
    vi.clearAllMocks();
  });

  it('should initialize with default language', () => {
    expect(i18n.language).toBe('en');
    expect(isRTL()).toBe(false);
  });

  it('should change language correctly', () => {
    changeLanguage('ar');
    expect(i18n.language).toBe('ar');
  });

  it('should dispatch custom event when language changes', () => {
    changeLanguage('ar');
    
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    
    // التحقق من أن الحدث المرسل هو حدث تغيير اللغة
    const dispatchCall = window.dispatchEvent.mock.calls[0][0];
    expect(dispatchCall.type).toBe(CUSTOM_EVENTS.LANGUAGE_CHANGED);
    expect(dispatchCall.detail).toEqual({
      language: 'ar',
      direction: 'rtl'
    });
  });

  it('should detect RTL languages correctly', () => {
    changeLanguage('en');
    expect(isRTL()).toBe(false);
    
    changeLanguage('ar');
    expect(isRTL()).toBe(true);
    
    changeLanguage('he');
    expect(isRTL()).toBe(true);
    
    changeLanguage('fr'); // لغة غير مدعومة، يجب أن تستخدم اللغة الافتراضية
    expect(isRTL()).toBe(false);
  });

  it('should use fallback language when unsupported language is requested', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    changeLanguage('invalid-lang');
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(i18n.language).toBe(LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE);
    
    consoleSpy.mockRestore();
  });

  it('should correctly check for translation existence', () => {
    i18n.addResourceBundle('en', 'common', { test: { key: 'Test Value' } }, true, true);
    
    expect(hasTranslation('test.key')).toBe(true);
    expect(hasTranslation('test.nonexistent')).toBe(false);
  });

  it('should respect the supportedLanguages configuration', () => {
    // التحقق من أن قائمة اللغات المدعومة تطابق الثوابت
    expect(LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES).toContain('en');
    expect(LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES).toContain('ar');
  });
});