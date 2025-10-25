// filepath: c:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\frontend\src\components\PointsDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

// API functions
const fetchPointsSummary = () => api.get('/points');
const fetchPointsHistory = () => api.get('/points/history');
const fetchImpactData = () => api.get('/points/impact');

const PointsDashboard = () => {
  const { t } = useTranslation();
  
  const { 
    data: pointsSummary, 
    isLoading: summaryLoading, 
    error: summaryError 
  } = useQuery({
    queryKey: ['points-summary'],
    queryFn: fetchPointsSummary
  });
  
  const { 
    data: pointsHistory, 
    isLoading: historyLoading, 
    error: historyError 
  } = useQuery({
    queryKey: ['points-history'],
    queryFn: fetchPointsHistory
  });
  
  const { 
    data: impactData, 
    isLoading: impactLoading, 
    error: impactError 
  } = useQuery({
    queryKey: ['impact-data'],
    queryFn: fetchImpactData
  });
  
  // Combined loading state
  const isLoading = summaryLoading || historyLoading || impactLoading;
  
  // Handle errors
  if (summaryError || historyError || impactError) {
    return (
      <div className="error-container">
        <h2>{t('errors.dataLoadingError')}</h2>
        <p>{t('errors.tryAgainLater')}</p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" data-testid="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="points-dashboard">
      <h1>{t('points.title')}</h1>
      
      {pointsSummary && (
        <div className="points-summary">
          <h2>{t('points.summary')}</h2>
          <div className="stats-container">
            <div className="stat-card">
              <h3>{t('points.balance')}</h3>
              <p className="stat-value">{pointsSummary.balance}</p>
            </div>
            <div className="stat-card">
              <h3>{t('points.impact')}</h3>
              <p className="stat-value">{pointsSummary.impact}</p>
            </div>
            <div className="stat-card">
              <h3>{t('points.reward')}</h3>
              <p className="stat-value">{pointsSummary.reward}</p>
            </div>
            <div className="stat-card">
              <h3>{t('points.monthly')}</h3>
              <p className="stat-value">{pointsSummary.monthlyPoints}</p>
            </div>
            <div className="stat-card">
              <h3>{t('points.streak')}</h3>
              <p className="stat-value">{pointsSummary.streak} {t('points.days')}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="points-history">
        <h2>{t('points.history')}</h2>
        {pointsHistory && pointsHistory.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.description')}</th>
                <th>{t('points.points')}</th>
                <th>{t('common.type')}</th>
              </tr>
            </thead>
            <tbody>
              {pointsHistory.map(transaction => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                  <td>{transaction.description}</td>
                  <td className={transaction.type === 'earn' ? 'points-earned' : 'points-spent'}>
                    {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.points)}
                  </td>
                  <td>{t(`points.sources.${transaction.source}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">{t('points.noHistoryAvailable')}</p>
        )}
      </div>
      
      {impactData && impactData.length > 0 && (
        <div className="impact-section">
          <h2>{t('impact.title')}</h2>
          <div className="impact-data">
            {impactData.map(item => (
              <div key={item.label} className="impact-item">
                <span className="impact-label">{t(`impact.types.${item.label}`)}</span>
                <span className="impact-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDashboard;