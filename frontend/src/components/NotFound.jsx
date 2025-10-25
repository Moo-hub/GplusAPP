import useSafeTranslation from '../hooks/useSafeTranslation';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const { t } = useSafeTranslation();
  
  return (
    <div className="not-found" data-testid="not-found-container">
      <h1 data-testid="not-found-title">404</h1>
      <p data-testid="not-found-message">{t('errors.pageNotFound')}</p>
      <Link to="/" className="btn-primary" data-testid="back-to-home-link">
        {t('common.backToHome')}
      </Link>
    </div>
  );
};

export default NotFound;