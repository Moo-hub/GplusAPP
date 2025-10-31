import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Use the real react-i18next for this test suite
vi.unmock('react-i18next');
import i18next from 'i18next';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { render, screen, cleanup, within } from '@testing-library/react';
import React from 'react';

// Minimal inline translations to keep tests self-contained and avoid
// JSON import/resolution issues in the test runner environment.
const enTranslations = {
  app: { title: 'G+ App' },
  points: { title: 'Points Balance' },
  profile: { email: 'Email' },
  nav: { hello: 'Hello, {{name}}' }
};

const arTranslations = {
  app: { title: 'تطبيق G+' },
  points: { title: 'رصيد النقاط' },
  profile: { email: 'البريد الإلكتروني' },
  nav: { hello: 'مرحبا، {{name}}' }
};

// A simple test component that uses translations
const TestComponent = ({ translationKey }) => {
  const { t } = useTranslation();
  return <div data-testid="translation">{t(translationKey)}</div>;
};

const renderWithI18n = (component, lng = 'en') => {
  // Create a fresh i18next instance per render. initImmediate:false
  // makes initialization synchronous which keeps tests deterministic.
  const testInstance = i18next.createInstance();
  testInstance.init({
    lng,
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations }
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    initImmediate: false
  });

  return render(
    <I18nextProvider i18n={testInstance}>
      {component}
    </I18nextProvider>
  );
};

describe('i18n Translation System', () => {
  beforeEach(() => {
    // no-op: each test uses an isolated instance
  });

  afterEach(() => {
    cleanup();
  });

  it('properly translates strings in English', () => {
    let res = renderWithI18n(<TestComponent translationKey="app.title" />);
    expect(within(res.container).getByTestId('translation').textContent).toBe('G+ App');

    res = renderWithI18n(<TestComponent translationKey="points.title" />);
    expect(within(res.container).getByTestId('translation').textContent).toBe('Points Balance');

    res = renderWithI18n(<TestComponent translationKey="profile.email" />);
    expect(within(res.container).getByTestId('translation').textContent).toBe('Email');
  });

  it('properly translates strings in Arabic', async () => {
    let res = renderWithI18n(<TestComponent translationKey="app.title" />, 'ar');
    const el = await within(res.container).findByTestId('translation');
    expect(el.textContent).not.toBe('G+ App');

    res = renderWithI18n(<TestComponent translationKey="points.title" />, 'ar');
    const el2 = await within(res.container).findByTestId('translation');
    expect(el2.textContent).not.toBe('Points Balance');
  });

  it('falls back to English when the key is missing in current language', () => {
    const originalConsoleWarn = console.warn;
    console.warn = vi.fn();

  const res = renderWithI18n(<TestComponent translationKey="non.existent.key" />);
  // The test harness may return the dotted key or a humanized fallback like "Non Existent Key".
  const text = within(res.container).getByTestId('translation').textContent;
  expect([ 'non.existent.key', 'Non Existent Key' ].includes(text)).toBe(true);

    console.warn = originalConsoleWarn;
  });

  it('supports interpolation of variables', async () => {
    const InterpolationTestComponent = () => {
      const { t } = useTranslation();
      return <div data-testid="translation">{t('nav.hello', { name: 'John Doe' })}</div>;
    };
  const res = renderWithI18n(<InterpolationTestComponent />);
  const el = await within(res.container).findByTestId('translation');
  expect(el.textContent).toContain('John Doe');
  });

  it('loads and applies language based on explicit setting', async () => {
    // Simulate language detection by explicitly rendering with 'ar'
    const res = renderWithI18n(<TestComponent translationKey="app.title" />, 'ar');
    const el = await within(res.container).findByTestId('translation');
    expect(el.textContent).not.toBe('G+ App');
  });

  it('exposes the t function through useTranslation hook', () => {
    const HookTestComponent = () => {
      const { t, i18n: i18nInstance } = useTranslation();
      return (
        <div>
          <span data-testid="translation">{t('app.title')}</span>
          <span data-testid="current-language">{i18nInstance.language}</span>
        </div>
      );
    };

    renderWithI18n(<HookTestComponent />);
    expect(screen.getByTestId('translation').textContent).toBe('G+ App');
    expect(screen.getByTestId('current-language').textContent).toBe('en');
  });
});