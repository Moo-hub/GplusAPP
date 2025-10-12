/**
 * @file i18nSetup.test.jsx - اختبارات لمكونات إعداد الترجمة متعددة اللغات
 * @module i18n/__tests__/i18nSetup.test
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, DirectionController, useLanguage } from '../../i18nSetup';
import * as i18nModule from '../i18n';
import { LANGUAGE_CONSTANTS } from '../../constants';

// إنشاء مكون اختبار لاستخدام هوك useLanguage
const TestComponent = () => {
  const { language, direction, changeLanguage, isRTL } = useLanguage();
  
  return (
    <div data-testid="test-component">
      <div data-testid="current-language">{language}</div>
      <div data-testid="current-direction">{direction}</div>
      <div data-testid="is-rtl">{isRTL ? 'true' : 'false'}</div>
      <button onClick={() => changeLanguage('ar')} data-testid="change-to-ar">
        Change to Arabic
      </button>
      <button onClick={() => changeLanguage('en')} data-testid="change-to-en">
        Change to English
      </button>
    </div>
  );
};

describe('i18nSetup components', () => {
  // محاكاة وحدة i18n
  beforeEach(() => {
    vi.spyOn(i18nModule, 'changeLanguage').mockImplementation((lng) => {
      // محاكاة تغيير اللغة
      vi.spyOn(i18nModule.default, 'language', 'get').mockReturnValue(lng);
      return Promise.resolve();
    });
    
    vi.spyOn(i18nModule, 'isRTL').mockImplementation(() => {
      return i18nModule.default.language === 'ar' || i18nModule.default.language === 'he';
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LanguageProvider', () => {
    it('should provide language context to children', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      // التحقق من القيم الافتراضية
      expect(screen.getByTestId('current-language').textContent).toBe('en');
      expect(screen.getByTestId('current-direction').textContent).toBe('ltr');
      expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    });
    
    it('should update language and direction when language changes', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      // تغيير اللغة إلى العربية
      fireEvent.click(screen.getByTestId('change-to-ar'));
      
      // التحقق من تحديث القيم
      expect(i18nModule.changeLanguage).toHaveBeenCalledWith('ar');
      
      // يجب أن نستخدم await لأن تغيير اللغة يتم بشكل غير متزامن
      await vi.waitFor(() => {
        expect(screen.getByTestId('current-language').textContent).toBe('ar');
      });
    });
    
    it('should respond to language change events from outside', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      // محاكاة حدث تغيير اللغة من خارج المكون
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: 'ar', direction: 'rtl' }
      }));
      
      // التحقق من تحديث القيم
      expect(screen.getByTestId('current-language').textContent).toBe('ar');
      expect(screen.getByTestId('current-direction').textContent).toBe('rtl');
      expect(screen.getByTestId('is-rtl').textContent).toBe('true');
    });
  });

  describe('DirectionController', () => {
    it('should update document direction and language based on language context', () => {
      render(
        <LanguageProvider>
          <DirectionController />
          <TestComponent />
        </LanguageProvider>
      );
      
      // التحقق من القيم الافتراضية
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
      expect(document.body.classList.contains('ltr')).toBe(true);
      expect(document.body.classList.contains('rtl')).toBe(false);
      
      // تغيير اللغة إلى العربية
      fireEvent.click(screen.getByTestId('change-to-ar'));
      
      // التحقق من تحديث القيم
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
      expect(document.body.classList.contains('rtl')).toBe(true);
      expect(document.body.classList.contains('ltr')).toBe(false);
      
      // العودة إلى اللغة الإنجليزية
      fireEvent.click(screen.getByTestId('change-to-en'));
      
      // التحقق من تحديث القيم
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
      expect(document.body.classList.contains('ltr')).toBe(true);
      expect(document.body.classList.contains('rtl')).toBe(false);
    });
  });

  describe('useLanguage hook', () => {
    it('should throw error when used outside LanguageProvider', () => {
      // كتم الأخطاء أثناء الاختبار
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLanguage must be used within a LanguageProvider');
      
      // استعادة console.error
      console.error.mockRestore();
    });
  });
});