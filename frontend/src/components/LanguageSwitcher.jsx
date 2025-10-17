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
    <div className="language-switcher" data-testid="language-switcher">
      <button 
        onClick={() => changeLanguage('en')} 
        className={i18n.language === 'en' ? 'active' : ''}
        data-testid="language-button-en"
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('ar')} 
        className={i18n.language === 'ar' ? 'active' : ''}
        data-testid="language-button-ar"
      >
        عربي
      </button>
    </div>
  );
};

export default LanguageSwitcher;