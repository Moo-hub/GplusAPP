/**
 * @file LanguageSwitcherWithRoute.jsx - مكون تبديل اللغة مع الحفاظ على المسار الحالي
 * @module components/common/LanguageSwitcherWithRoute
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../i18nSetup';
import { useLanguageChanger } from '../../hooks/useLocalizedRouting';
import { LANGUAGE_CONSTANTS } from '../../constants/i18n';
import useTranslationNamespaces from '../../hooks/useTranslationNamespaces';
import { useDirectionalStyles } from '../../utils/directionalHelpers';

/**
 * مكون تبديل اللغة مع الحفاظ على المسار الحالي
 *
 * @param {Object} props - خصائص المكون
 * @param {string} [props.className] - فئة CSS للمكون
 * @param {Object} [props.style] - أنماط CSS إضافية
 * @returns {React.ReactElement} مكون تبديل اللغة
 */
const LanguageSwitcherWithRoute = ({ className = '', style = {} }) => {
  const { language } = useLanguage();
  const changeLanguageAndRoute = useLanguageChanger();
  const { t } = useTranslationNamespaces(['common']);
  const directionalStyles = useDirectionalStyles();
  
  // تحديد خيارات اللغات المدعومة
  const languageOptions = LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.map(lang => ({
    code: lang,
    name: t(`common.languages.${lang}`)
  }));
  
  // معالجة تغيير اللغة
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    if (newLanguage !== language) {
      changeLanguageAndRoute(newLanguage);
    }
  };
  
  return (
    <div 
      className={`language-switcher ${className}`} 
      style={{
        ...directionalStyles.direction(),
        ...style
      }}
    >
      <select
        value={language}
        onChange={handleLanguageChange}
        aria-label={t('common.selectLanguage', 'Select language')}
        className="language-select"
      >
        {languageOptions.map(option => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * مكون تبديل اللغة بواسطة الأزرار
 *
 * @param {Object} props - خصائص المكون
 * @param {string} [props.className] - فئة CSS للمكون
 * @param {Object} [props.style] - أنماط CSS إضافية
 * @returns {React.ReactElement} مكون تبديل اللغة
 */
export const LanguageSwitcherButtons = ({ className = '', style = {} }) => {
  const { language } = useLanguage();
  const changeLanguageAndRoute = useLanguageChanger();
  const { t } = useTranslationNamespaces(['common']);
  const directionalStyles = useDirectionalStyles();
  
  // معالجة تغيير اللغة
  const handleLanguageClick = (newLanguage) => {
    if (newLanguage !== language) {
      changeLanguageAndRoute(newLanguage);
    }
  };
  
  return (
    <div 
      className={`language-switcher-buttons ${className}`} 
      style={{
        display: 'flex',
        gap: '8px',
        ...directionalStyles.direction(),
        ...style
      }}
      role="group"
      aria-label={t('common.selectLanguage', 'Select language')}
    >
      {LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.map(lang => (
        <button
          key={lang}
          onClick={() => handleLanguageClick(lang)}
          className={`language-button ${lang === language ? 'active' : ''}`}
          aria-pressed={lang === language}
        >
          {t(`common.languages.${lang}`, lang.toUpperCase())}
        </button>
      ))}
    </div>
  );
};

LanguageSwitcherWithRoute.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
};

LanguageSwitcherButtons.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
};

export default LanguageSwitcherWithRoute;