import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageSwitcher from '../LanguageSwitcher';

// Get a reference to the real useTranslation function for mocking
import { useTranslation } from 'react-i18next';

// Mock the react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    i18n: {
      language: 'en',
      changeLanguage: vi.fn()
    }
  }))
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
    render(<LanguageSwitcher />);
    
    // Check that the language switcher and both buttons are rendered
    const switcher = screen.getByTestId('language-switcher');
    const englishButton = screen.getByTestId('language-button-en');
    const arabicButton = screen.getByTestId('language-button-ar');
    
    expect(switcher).toBeInTheDocument();
    expect(englishButton).toBeInTheDocument();
    expect(arabicButton).toBeInTheDocument();
    
    // English should be active by default based on our mock
    expect(englishButton).toHaveClass('active');
    expect(arabicButton).not.toHaveClass('active');
    
    // Check button text
    expect(englishButton).toHaveTextContent('EN');
    expect(arabicButton).toHaveTextContent('عربي');
  });

  it('changes language to Arabic when Arabic button is clicked', () => {
    // Setup our mocked i18n implementation for this specific test
    const changeLanguageMock = vi.fn();
    
    vi.mocked(useTranslation).mockReturnValue({
      i18n: {
        language: 'en',
        changeLanguage: changeLanguageMock
      }
    });

    render(<LanguageSwitcher />);
    
    // Find and click the Arabic button
    const arabicButton = screen.getByTestId('language-button-ar');
    fireEvent.click(arabicButton);
    
    // Check that i18n.changeLanguage was called with 'ar'
    expect(changeLanguageMock).toHaveBeenCalledWith('ar');
    
    // Check that document properties would be updated correctly
    // (note: the actual update happens in the component, but we mock for testing)
    expect(document.documentElement.lang).toBe('ar');
    expect(document.dir).toBe('rtl');
  });

  it('changes language to English when English button is clicked', () => {
    // Setup our mocked i18n implementation for this specific test
    // Starting with Arabic as the current language
    const changeLanguageMock = vi.fn();
    
    vi.mocked(useTranslation).mockReturnValue({
      i18n: {
        language: 'ar',
        changeLanguage: changeLanguageMock
      }
    });

    render(<LanguageSwitcher />);
    
    // Find and click the English button
    const englishButton = screen.getByTestId('language-button-en');
    fireEvent.click(englishButton);
    
    // Check that i18n.changeLanguage was called with 'en'
    expect(changeLanguageMock).toHaveBeenCalledWith('en');
    
    // Check that document properties would be updated correctly
    expect(document.documentElement.lang).toBe('en');
    expect(document.dir).toBe('ltr');
  });

  // Restore original document properties after tests
  afterAll(() => {
    document.documentElement.lang = originalDocumentProps.documentElement.lang;
    document.dir = originalDocumentProps.dir;
  });
});