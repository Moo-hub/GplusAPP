import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageContext from '../contexts/LanguageContext';

/**
 * Custom hook for language-related functionality
 * @returns {Object} Language utilities and state
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  const { i18n } = useTranslation();
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  const { language, setLanguage } = context;
  
  const supportedLanguages = useMemo(() => {
    return i18n.options?.supportedLngs || ['en', 'ar'];
  }, [i18n.options?.supportedLngs]);
  
  // Change language function
  const changeLanguage = (newLanguage) => {
    if (supportedLanguages.includes(newLanguage)) {
      i18n.changeLanguage(newLanguage);
      setLanguage(newLanguage);
      
      // Set document direction
      const dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = newLanguage;
    }
  };
  
  // Check if current language is RTL
  const isRTL = useMemo(() => {
    return language === 'ar'; // Add other RTL languages as needed
  }, [language]);
  
  return {
    language,
    changeLanguage,
    isRTL,
    supportedLanguages,
    languageDirection: isRTL ? 'rtl' : 'ltr'
  };
};

/**
 * Custom hook for language direction (RTL/LTR)
 * @returns {Object} Direction information
 */
export const useLanguageDirection = () => {
  const { isRTL, languageDirection } = useLanguage();
  
  return {
    isRTL,
    direction: languageDirection
  };
};

export default useLanguage;