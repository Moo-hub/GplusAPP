import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageSwitcher from '../LanguageSwitcher';

// Get a reference to the real useTranslation function for mocking

import { useTranslation } from 'react-i18next';
// Global stateful i18n mock
const i18nMock = {
  language: 'en',
  changeLanguage: vi.fn()
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: i18nMock })
}));

// Mock document properties for testing
const originalDocumentProps = {
  documentElement: { ...document.documentElement },
  dir: document.dir
};

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    // Reset mocks and document properties before each test
    vi.clearAllMocks();
    document.documentElement.lang = 'en';
    document.dir = 'ltr';
  });

  it('renders language switcher buttons', () => {
    i18nMock.language = 'en';
    i18nMock.changeLanguage = vi.fn();
    render(<LanguageSwitcher />);
    // Check that the language switcher and both buttons are rendered
    const switcher = screen.getByTestId('language-switcher');
    const englishButtons = screen.getAllByTestId('language-button-en');
    const arabicButtons = screen.getAllByTestId('language-button-ar');
    expect(switcher).toBeInTheDocument();
    expect(englishButtons.length).toBeGreaterThan(0);
    expect(arabicButtons.length).toBeGreaterThan(0);
    // English should be active by default based on our mock
    englishButtons.forEach(btn => expect(btn.className).toContain('active'));
    arabicButtons.forEach(btn => expect(btn.className).not.toContain('active'));
    // Check button text
    englishButtons.forEach(btn => expect(btn).toHaveTextContent('EN'));
    arabicButtons.forEach(btn => expect(btn).toHaveTextContent('عربي'));
  });

  it('changes language to Arabic when Arabic button is clicked', () => {
    i18nMock.language = 'en';
    const changeLanguageMock = vi.fn((lng) => { i18nMock.language = lng; });
    i18nMock.changeLanguage = changeLanguageMock;
    render(<LanguageSwitcher />);
    const arabicButtons = screen.getAllByTestId('language-button-ar');
    fireEvent.click(arabicButtons[0]);
  expect(changeLanguageMock).toHaveBeenCalledWith('ar');
  expect(document.documentElement.lang).toBe('ar');
  expect(document.dir).toBe('rtl');
  });

  it('changes language to English when English button is clicked', () => {
    i18nMock.language = 'ar';
    const changeLanguageMock = vi.fn((lng) => { i18nMock.language = lng; });
    i18nMock.changeLanguage = changeLanguageMock;
    render(<LanguageSwitcher />);
    const englishButtons = screen.getAllByTestId('language-button-en');
    fireEvent.click(englishButtons[0]);
  expect(changeLanguageMock).toHaveBeenCalledWith('en');
  expect(document.documentElement.lang).toBe('en');
  expect(document.dir).toBe('ltr');
  });

  // Restore original document properties after tests
  afterAll(() => {
    document.documentElement.lang = originalDocumentProps.documentElement.lang;
    document.dir = originalDocumentProps.dir;
  });
});