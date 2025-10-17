import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const fetchCompanies = () => api.get('/companies');

const CompanyList = () => {
  const { t } = useTranslation();
  
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies
  });
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>{t('errors.dataLoadingError')}</h2>
        <p>{t('errors.tryAgainLater')}</p>
      </div>
    );
  }
  
  return (
    <div className="companies-container">
      <h1>{t('companies.title')}</h1>
      
      {companies && companies.length > 0 ? (
        <div className="company-grid">
          {companies.map(company => (
            <Link to={`/companies/${company.id}`} key={company.id} className="company-card">
              {company.logo_url && (
                <img src={company.logo_url} alt={company.name} className="company-logo" />
              )}
              <h3>{company.name}</h3>
              <p className="company-type">{t(`companies.types.${company.type}`)}</p>
              <p className="company-location">{company.location}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="no-data-message">{t('companies.noCompanies')}</p>
      )}
    </div>
  );
};

export default CompanyList;