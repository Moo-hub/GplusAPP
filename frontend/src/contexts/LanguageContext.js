import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18next';

// Language constants
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'ar'],
  RTL_LANGUAGES: ['ar']
};

// Create context
const LanguageContext = createContext();

/**
 * Language Provider Component
 * 
 * Provides language state and functions to change language across the application.
 * Sets up document direction (RTL/LTR) based on the current language.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.initialLanguage - Initial language to use (defaults to user preference or 'en')
 * @returns {JSX.Element} The language provider component
 */
export const LanguageProvider = ({ children, initialLanguage }) => {
  // Try to get stored language preference or use navigator language
  const getInitialLanguage = () => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.includes(storedLang)) {
      return storedLang;
    }
    
    // Use provided initialLanguage if specified
    if (initialLanguage && LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.includes(initialLanguage)) {
      return initialLanguage;
    }
    
    // Try to match browser language
    const browserLang = navigator.language.split('-')[0];
    if (LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
    
    // Default to English
    return LANGUAGE_CONSTANTS.DEFAULT_LANGUAGE;
  };

  const [language, setLanguage] = useState(getInitialLanguage);

  // Effect to set document direction and language attributes
  useEffect(() => {
    // Set document direction based on language
    const dir = LANGUAGE_CONSTANTS.RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Store language preference
    localStorage.setItem('language', language);
    
    // Update i18n language
    i18n.changeLanguage(language);
  }, [language]);

  const value = {
    language,
    setLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialLanguage: PropTypes.string
};

export default LanguageContext;