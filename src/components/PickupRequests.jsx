import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../services/api';
import './PickupRequests.css';

const fetchPickupRequests = async () => {
  const response = await api.get('/pickup');
  return response.data;
};

const cancelPickupRequest = async (id) => {
  return api.delete(`/pickup/${id}`);
};

const PickupRequests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelingId, setCancelingId] = useState(null);
  
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

  const cancelMutation = useMutation({
    mutationFn: cancelPickupRequest,
    onMutate: (id) => {
      setCancelingId(id);
    },
    onSuccess: () => {
      toast.success(t('pickup.cancelSuccess'));
      queryClient.invalidateQueries(['pickup-requests']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || t('errors.generalError'));
    },
    onSettled: () => {
      setCancelingId(null);
    }
  });

  const handleCancelPickup = (id) => {
    if (window.confirm(t('pickup.confirmCancel'))) {
      cancelMutation.mutate(id);
    }
  };

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
        <div className="header-actions">
          <Link to="/pickups/calendar" className="btn-secondary">
            <i className="fa fa-calendar"></i> {t('pickup.calendarView')}
          </Link>
          <Link to="/pickups/new" className="btn-primary">
            <i className="fa fa-plus"></i> {t('pickup.scheduleNew')}
          </Link>
        </div>
      </div>

      {pickups && pickups.length > 0 ? (
        <div className="pickup-list">
          {pickups.map(pickup => (
            <div key={pickup.id} className={`pickup-card pickup-${pickup.status}`}>
              <div className="pickup-header">
                <div className="pickup-date-info">
                  <h3>{new Date(pickup.scheduled_date).toLocaleDateString()}</h3>
                  {pickup.time_slot && (
                    <span className="pickup-time-slot">{pickup.time_slot}</span>
                  )}
                </div>
                <div className="pickup-status-container">
                  {pickup.is_recurring && (
                    <span className="pickup-recurring-badge" title={t(`pickup.recurrence.${pickup.recurrence_type}`)}>
                      <i className="fa fa-repeat"></i>
                      {t('pickup.recurring')}
                    </span>
                  )}
                  <span className="pickup-status">
                    {t(`pickup.status.${pickup.status}`)}
                  </span>
                </div>
              </div>
              
              <div className="pickup-details">
                <p>
                  <strong>{t('pickup.materials')}:</strong>{' '}
                  {pickup.materials.map(m => t(`materials.${m}`)).join(', ')}
                </p>
                <p>
                  <strong>{t('pickup.weight')}:</strong> {pickup.weight_estimate} kg
                </p>
                {pickup.is_recurring && (
                  <p>
                    <strong>{t('pickup.recurrenceInfo')}:</strong>{' '}
                    {t(`pickup.recurrence.${pickup.recurrence_type}`)}
                    {pickup.recurrence_end_date && (
                      <span> {t('pickup.until')} {new Date(pickup.recurrence_end_date).toLocaleDateString()}</span>
                    )}
                  </p>
                )}
                <p>
                  <strong>{t('pickup.address')}:</strong> {pickup.address}
                </p>
              </div>
              
              <div className="pickup-actions">
                {pickup.status !== 'completed' && pickup.status !== 'cancelled' && (
                  <>
                    <button className="btn-text" onClick={() => navigate(`/pickups/edit/${pickup.id}`)}>
                      {t('common.edit')}
                    </button>
                    <button className="btn-text btn-danger" onClick={() => handleCancelPickup(pickup.id)}>
                      {t('common.cancel')}
                    </button>
                  </>
                )}
                {pickup.calendar_event_id && (
                  <a 
                    href="#" 
                    className="btn-text calendar-link" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`https://calendar.google.com/calendar/event?eid=${pickup.calendar_event_id}`, '_blank');
                    }}
                  >
                    <i className="fa fa-calendar"></i> {t('pickup.viewInCalendar')}
                  </a>
                )}
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