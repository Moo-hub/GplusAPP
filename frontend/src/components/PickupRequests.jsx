import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const fetchPickupRequests = () => api.get('/pickup');

const PickupRequests = () => {
  const { t } = useTranslation();
  
  const { 
    data: pickups, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['pickup-requests'],
    queryFn: fetchPickupRequests,
    onSuccess: (data) => {
      console.log('Pickups data:', data);
    },
    onError: (err) => {
      console.error('Error fetching pickups:', err);
    }
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
    <div className="pickup-requests">
      <div className="page-header">
        <h1>{t('pickup.title')}</h1>
        <Link to="/pickups/new" className="btn-primary">
          {t('pickup.scheduleNew')}
        </Link>
      </div>

      {pickups && pickups.length > 0 ? (
        <div className="pickup-list">
          {pickups.map(pickup => (
            <div key={pickup.id} className={`pickup-card pickup-${pickup.status}`}>
              <div className="pickup-header">
                <h3>{new Date(pickup.scheduled_date).toLocaleDateString()}</h3>
                <span className="pickup-status">
                  {t(`pickup.status.${pickup.status}`)}
                </span>
              </div>
              
              <div className="pickup-details">
                <p>
                  <strong>{t('pickup.materials')}:</strong>{' '}
                  {pickup.materials.map(m => t(`materials.${m}`)).join(', ')}
                </p>
                <p>
                  <strong>{t('pickup.weight')}:</strong> {pickup.weight_estimate} kg
                </p>
                <p>
                  <strong>{t('pickup.address')}:</strong> {pickup.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-message">
          <p>{t('pickup.noRequests')}</p>
          <Link to="/pickups/new" className="btn-secondary">
            {t('pickup.scheduleFirst')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default PickupRequests;