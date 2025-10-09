import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="language-switcher" role="group" aria-label="Language selection">
      <button 
        onClick={() => changeLanguage('en')} 
        className={i18n.language === 'en' ? 'active' : ''}
        aria-label="Switch to English"
        aria-pressed={i18n.language === 'en'}
        lang="en"
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('ar')} 
        className={i18n.language === 'ar' ? 'active' : ''}
        aria-label="Switch to Arabic"
        aria-pressed={i18n.language === 'ar'}
        lang="ar"
      >
        عربي
      </button>
    </div>
  );
};

export default LanguageSwitcher;