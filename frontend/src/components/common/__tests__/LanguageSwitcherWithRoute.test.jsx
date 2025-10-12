import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LanguageSwitcherWithRoute from '../LanguageSwitcherWithRoute';

// Mock hooks
jest.mock('../../../hooks/useLocalizedRouting', () => ({
  useLanguageChanger: () => jest.fn()
}));

// Mock useLanguage hook
jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    supportedLanguages: ['en', 'ar']
  })
}));

describe('LanguageSwitcherWithRoute', () => {
  test('renders dropdown by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LanguageSwitcherWithRoute className="test-class" />
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check if it has the correct class
    const container = select.parentElement;
    expect(container).toHaveClass('language-switcher-dropdown');
    expect(container).toHaveClass('test-class');
  });

  test('renders buttons when useButtons is true', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LanguageSwitcherWithRoute useButtons={true} className="test-class" />
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    const buttonContainer = screen.getByRole('button').parentElement;
    expect(buttonContainer).toHaveClass('language-switcher-buttons');
    expect(buttonContainer).toHaveClass('test-class');
    
    // Should have buttons for each language
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2); // For English and Arabic
  });

  test('marks the current language button as active', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LanguageSwitcherWithRoute useButtons={true} className="test-class" />
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    // Since our mock returns 'en' as current language, the English button should be active
    const buttons = screen.getAllByRole('button');
    
    // Get English button (first button as per our mock)
    const englishButton = buttons[0];
    expect(englishButton).toHaveClass('active');
    
    // Arabic button should not be active
    const arabicButton = buttons[1];
    expect(arabicButton).not.toHaveClass('active');
  });
});