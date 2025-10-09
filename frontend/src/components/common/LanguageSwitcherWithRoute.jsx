import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { useLanguageChanger } from '../../hooks/useLocalizedRouting';

/**
 * LanguageSwitcherWithRoute Component
 * 
 * A language switcher that preserves the current route when changing languages.
 * Can be rendered as either a dropdown select or as separate buttons for each language.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.useButtons - Whether to use buttons instead of a dropdown
 * @param {string} props.className - Additional CSS class for the component
 * @returns {JSX.Element} The language switcher component
 */
const LanguageSwitcherWithRoute = ({ useButtons = false, className = '' }) => {
  const { t } = useTranslation();
  const { language, supportedLanguages } = useLanguage();
  const changeLanguageAndRoute = useLanguageChanger();
  
  // Handler for language change
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    changeLanguageAndRoute(newLanguage);
  };
  
  // Handler for button click
  const handleLanguageButtonClick = (lang) => {
    changeLanguageAndRoute(lang);
  };
  
  // Display language name based on language code
  const getLanguageName = (langCode) => {
    const languageNames = {
      en: t('common.languages.english'),
      ar: t('common.languages.arabic'),
      // Add more languages as needed
    };
    
    return languageNames[langCode] || langCode;
  };
  
  // Render as buttons
  if (useButtons) {
    return (
      <div className={`language-switcher-buttons ${className}`}>
        {supportedLanguages.map(lang => (
          <button
            key={lang}
            onClick={() => handleLanguageButtonClick(lang)}
            className={`language-button ${lang === language ? 'active' : ''}`}
            aria-label={t('common.changeLanguage', { language: getLanguageName(lang) })}
          >
            {getLanguageName(lang)}
          </button>
        ))}
      </div>
    );
  }
  
  // Render as dropdown
  return (
    <div className={`language-switcher-dropdown ${className}`}>
      <select 
        value={language} 
        onChange={handleLanguageChange}
        aria-label={t('common.selectLanguage')}
      >
        {supportedLanguages.map(lang => (
          <option key={lang} value={lang}>
            {getLanguageName(lang)}
          </option>
        ))}
      </select>
    </div>
  );
};

LanguageSwitcherWithRoute.propTypes = {
  useButtons: PropTypes.bool,
  className: PropTypes.string
};

export default LanguageSwitcherWithRoute;