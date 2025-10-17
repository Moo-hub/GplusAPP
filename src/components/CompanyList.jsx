import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompanies } from '../hooks/useCompanies';
import LoadingSpinner from './common/LoadingSpinner';

const CompanyList = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  
  // Use our custom React Query hook
  const { 
    data: companies = [], 
    isLoading, 
    error,
    refetch,
    isFetching
  } = useCompanies({ name: filter });
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" fullScreen />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>{t('errors.dataLoadingError')}</h2>
        <p>{error.message || t('errors.tryAgainLater')}</p>
        <button className="btn-secondary" onClick={() => refetch()}>
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="companies-container">
      <h1>{t('companies.title')}</h1>
      
      <div className="companies-filter">
        <input
          type="text"
          placeholder={t('companies.searchPlaceholder')}
          value={filter}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <button 
          className="btn-secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <LoadingSpinner size="small" /> : t('common.refresh')}
        </button>
      </div>
      
      {isFetching && !isLoading && (
        <div className="fetching-indicator">
          <LoadingSpinner size="small" />
          <span>{t('common.updating')}</span>
        </div>
      )}
      
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
        <div className="no-data-message">
          <p>{filter ? t('companies.noMatchingCompanies') : t('companies.noCompanies')}</p>
          {filter && (
            <button className="btn-secondary" onClick={() => setFilter('')}>
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyList;