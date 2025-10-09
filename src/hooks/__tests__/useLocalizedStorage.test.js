/**
 * @file useLocalizedStorage.test.js - اختبارات وحدة لهوك التخزين المحلي متعدد اللغات
 * @module hooks/__tests__/useLocalizedStorage.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import useLocalizedStorage from '../useLocalizedStorage';
import * as i18nSetupModule from '../../i18nSetup';

// محاكاة الوحدات المستخدمة
vi.mock('../../i18nSetup', () => ({
  useLanguage: vi.fn()
}));

describe('useLocalizedStorage hook', () => {
  // محاكاة localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
  })();
  
  // محاكاة window.dispatchEvent
  const dispatchEventMock = vi.fn();
  
  beforeEach(() => {
    // إعداد محاكاة localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // إعداد محاكاة dispatchEvent
    window.dispatchEvent = dispatchEventMock;
    
    // إعداد القيم الافتراضية للغة
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'en'
    });
    
    // مسح التخزين بين الاختبارات
    localStorageMock.clear();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default value when no value is stored', () => {
    const defaultValue = { test: 'default value' };
    
    const { result } = renderHook(() => useLocalizedStorage('testKey', defaultValue));
    
    expect(result.current[0]).toEqual(defaultValue);
  });
  
  it('should use language-specific keys for storage', () => {
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'ar'
    });
    
    const { result } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    act(() => {
      result.current[1]('test value');
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey_ar',
      JSON.stringify('test value')
    );
  });
  
  it('should store and retrieve values correctly', () => {
    const { result } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    // تخزين قيمة جديدة
    act(() => {
      result.current[1]('new value');
    });
    
    // التحقق من تخزين القيمة
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey_en',
      JSON.stringify('new value')
    );
    
    // التحقق من تحديث القيمة المخزنة في الحالة
    expect(result.current[0]).toBe('new value');
    
    // محاكاة إعادة تحميل الهوك
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify('new value'));
    
    const { result: newResult } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    // التحقق من استرجاع القيمة المخزنة
    expect(newResult.current[0]).toBe('new value');
  });
  
  it('should handle function updaters correctly', () => {
    const { result } = renderHook(() => useLocalizedStorage('testKey', 5));
    
    // تحديث القيمة باستخدام دالة تحديث
    act(() => {
      result.current[1]((prev) => prev + 10);
    });
    
    // التحقق من تخزين القيمة الجديدة
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey_en',
      JSON.stringify(15)
    );
    
    // التحقق من تحديث القيمة المخزنة في الحالة
    expect(result.current[0]).toBe(15);
  });
  
  it('should remove values correctly', () => {
    const { result } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    // تخزين قيمة
    act(() => {
      result.current[1]('test value');
    });
    
    // حذف القيمة
    act(() => {
      result.current[2]();
    });
    
    // التحقق من حذف القيمة
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey_en');
    
    // التحقق من إعادة تعيين القيمة إلى القيمة الافتراضية
    expect(result.current[0]).toBe('default');
  });
  
  it('should dispatch storage update event after changes', () => {
    const { result } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    // تخزين قيمة
    act(() => {
      result.current[1]('test value');
    });
    
    // التحقق من إطلاق حدث التخزين
    expect(dispatchEventMock).toHaveBeenCalled();
    expect(dispatchEventMock.mock.calls[0][0] instanceof Event).toBe(true);
    expect(dispatchEventMock.mock.calls[0][0].type).toBe('local-storage-update');
  });
  
  it('should handle JSON parsing errors gracefully', () => {
    // محاكاة قيمة غير صالحة في localStorage
    localStorageMock.getItem.mockReturnValueOnce('invalid JSON');
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    // يجب أن يتم استخدام القيمة الافتراضية في حالة وجود خطأ في التحليل
    expect(result.current[0]).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
  
  it('should use different storage for different languages', () => {
    // تخزين قيمة باللغة الإنجليزية
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'en'
    });
    
    const { result: resultEn } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    act(() => {
      resultEn.current[1]('English value');
    });
    
    // تخزين قيمة باللغة العربية
    i18nSetupModule.useLanguage.mockReturnValue({
      language: 'ar'
    });
    
    const { result: resultAr } = renderHook(() => useLocalizedStorage('testKey', 'default'));
    
    act(() => {
      resultAr.current[1]('Arabic value');
    });
    
    // التحقق من تخزين القيم بمفاتيح مختلفة
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey_en',
      JSON.stringify('English value')
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey_ar',
      JSON.stringify('Arabic value')
    );
  });
});