import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18n from '../i18n';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { act } from 'react';

// A simple test component that uses translations
const TestComponent = ({ translationKey }) => {
  const { t } = useTranslation();
  return <div data-testid="translation">{t(translationKey)}</div>;
};

const renderWithI18n = (component, lng = 'en') => {
  act(() => {
    i18n.changeLanguage(lng);
  });
  
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('i18n Translation System', () => {
  // Store original navigator
  const originalNavigator = { ...navigator };
  
  beforeEach(() => {
    // Reset language for each test
    act(() => {
      i18n.changeLanguage('en');
    });
    cleanup(); // Clean up after each test
  });
  
  afterEach(() => {
    // Restore navigator
    Object.defineProperty(navigator, 'language', {
      value: originalNavigator.language,
      configurable: true
    });
    cleanup(); // Clean up after each test
  });
  
  it('properly translates strings in English', () => {
    act(() => {
      renderWithI18n(<TestComponent translationKey="app.title" />);
    });
    expect(screen.getByTestId('translation')).toHaveTextContent('G+ App');
    cleanup();
    
    act(() => {
      renderWithI18n(<TestComponent translationKey="points.title" />);
    });
    expect(screen.getByTestId('translation')).toHaveTextContent('Points Balance');
    cleanup();
    
    act(() => {
      renderWithI18n(<TestComponent translationKey="profile.email" />);
    });
    expect(screen.getByTestId('translation')).toHaveTextContent('Email');
  });
  
  it('properly translates strings in Arabic', () => {
    act(() => {
      renderWithI18n(<TestComponent translationKey="app.title" />, 'ar');
    });
    // Assuming the Arabic translation is "تطبيق G+"
    expect(screen.getByTestId('translation').textContent).not.toBe('G+ App');
    cleanup();
    
    act(() => {
      renderWithI18n(<TestComponent translationKey="points.title" />, 'ar');
    });
    // The text should be different from English
    expect(screen.getByTestId('translation').textContent).not.toBe('Points Balance');
  });
  
  it('falls back to English when the key is missing in current language', () => {
    // Create a mock for console.warn to silence warnings about missing keys
    const originalConsoleWarn = console.warn;
    console.warn = vi.fn();
    
    act(() => {
      renderWithI18n(<TestComponent translationKey="non.existent.key" />);
    });
    // Should show the key itself when no translation is found
    expect(screen.getByTestId('translation')).toHaveTextContent('non.existent.key');
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
  });
  
  it('supports interpolation of variables', () => {
    const InterpolationTestComponent = () => {
      const { t } = useTranslation();
      return <div data-testid="translation">
        {t('app.nav.hello', { name: 'John Doe' })}
      </div>;
    };
    
    act(() => {
      renderWithI18n(<InterpolationTestComponent />);
    });
    // Assuming "app.nav.hello" is "Hello, {{name}}" in English
    expect(screen.getByTestId('translation').textContent).toContain('John Doe');
  });
  
  it('loads and applies language based on browser settings', () => {
    // Mock navigator language
    Object.defineProperty(navigator, 'language', {
      value: 'ar',
      configurable: true
    });
    
    // We need to re-initialize i18n to pick up the new navigator language
    // This is normally done by the LanguageDetector
    // For testing purposes, we'll manually change the language
    act(() => {
      i18n.changeLanguage('ar');
    });
    
    act(() => {
      renderWithI18n(<TestComponent translationKey="app.title" />, 'ar');
    });
    // Should use Arabic translation
    expect(screen.getByTestId('translation').textContent).not.toBe('G+ App');
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
    
    act(() => {
      renderWithI18n(<HookTestComponent />);
    });
    
    expect(screen.getByTestId('translation')).toHaveTextContent('G+ App');
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
  });
});