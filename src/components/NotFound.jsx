import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>{t('errors.pageNotFound')}</p>
      <Link to="/" className="btn-primary">
        {t('common.backToHome')}
      </Link>
    </div>
  );
};

export default NotFound;