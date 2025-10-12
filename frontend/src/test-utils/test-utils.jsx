import React from 'react';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';

// يجب استيراد ملف i18n الخاص بالاختبارات هنا
import i18n from './i18n-for-tests';

/**
 * مكون مساعد للاختبار يوفر جميع المزودين اللازمين لاختبار المكونات التي تستخدم i18n والتوجيه
 * 
 * @param {ReactNode} ui - المكون المراد اختباره
 * @param {Object} options - خيارات إضافية
 * @param {string} options.language - اللغة المراد استخدامها في الاختبار (الافتراضية: "en")
 * @param {string[]} options.initialEntries - المسارات الأولية للتوجيه
 * @param {Object} options.renderOptions - خيارات إضافية لدالة render من React Testing Library
 * @returns {Object} - نتيجة دالة render من React Testing Library
 */
export function renderWithI18nAndRouter(ui, {
  language = 'en',
  initialEntries = ['/'],
  ...renderOptions
} = {}) {
  const Wrapper = ({ children }) => {
    return (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage={language}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * مكون مساعد للاختبار يوفر مزود i18n فقط بدون التوجيه
 * 
 * @param {ReactNode} ui - المكون المراد اختباره
 * @param {Object} options - خيارات إضافية
 * @param {string} options.language - اللغة المراد استخدامها في الاختبار (الافتراضية: "en")
 * @param {Object} options.renderOptions - خيارات إضافية لدالة render من React Testing Library
 * @returns {Object} - نتيجة دالة render من React Testing Library
 */
export function renderWithI18n(ui, {
  language = 'en',
  ...renderOptions
} = {}) {
  const Wrapper = ({ children }) => {
    return (
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage={language}>
          {children}
        </LanguageProvider>
      </I18nextProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * مكون مساعد للاختبار يوفر مزود التوجيه فقط بدون i18n
 * 
 * @param {ReactNode} ui - المكون المراد اختباره
 * @param {Object} options - خيارات إضافية
 * @param {string[]} options.initialEntries - المسارات الأولية للتوجيه
 * @param {Object} options.renderOptions - خيارات إضافية لدالة render من React Testing Library
 * @returns {Object} - نتيجة دالة render من React Testing Library
 */
export function renderWithRouter(ui, {
  initialEntries = ['/'],
  ...renderOptions
} = {}) {
  const Wrapper = ({ children }) => {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';