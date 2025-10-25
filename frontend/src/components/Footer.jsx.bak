import { useTranslation } from 'react-i18next';
import './Footer.css';

/**
 * Footer component displays the site footer with copyright information
 */
const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="footer-content" data-testid="footer-content">
        <div className="footer-copyright" data-testid="copyright">
          &copy; {currentYear} G+ {t('footer.recycling')}
        </div>
        <div className="footer-links">
          <a href="/terms" data-testid="terms-link">{t('footer.terms')}</a>
          <a href="/privacy" data-testid="privacy-link">{t('footer.privacy')}</a>
          <a href="/contact" data-testid="contact-link">{t('footer.contact')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;