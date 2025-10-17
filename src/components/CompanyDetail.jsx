import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CompanyDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  
  return (
    <div className="company-detail">
      <h1>{t('companies.details')}</h1>
      <p>{t('companies.idLabel')}: {id}</p>
      <p>{t('common.comingSoon')}</p>
    </div>
  );
};

export default CompanyDetail;