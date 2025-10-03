// React is used implicitly for JSX
import { useTranslation } from 'react-i18next';
import './Cards.css';

const SystemHealthCard = ({ data }) => {
  const { t } = useTranslation();
  
  if (!data) {
    return (
      <div className="system-health-card skeleton" data-testid="system-health-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'status-healthy';
      case 'degraded':
        return 'status-degraded';
      default:
        return 'status-unavailable';
    }
  };
  
  return (
    <div className="system-health-card" data-testid="system-health-card">
      <h3>{t('dashboard.systemHealth')}</h3>
      
      <div className="services-grid" data-testid="services-grid">
        {Object.entries(data.services).map(([serviceName, serviceData]) => (
          <div key={serviceName} className="service-item" data-testid={`service-${serviceName}`}>
            <div className="service-header">
              <span 
                className={`status-indicator ${getStatusColor(serviceData.status)}`}
                data-testid={`status-indicator-${serviceName}`}
              ></span>
              <span className="service-name" data-testid={`service-name-${serviceName}`}>
                {t(`dashboard.${serviceName}`)}
              </span>
            </div>
            <div className="service-status" data-testid={`service-status-${serviceName}`}>
              {t(`dashboard.${serviceData.status}`)}
            </div>
            <div className="service-details">
              {serviceData.latency && (
                <div className="service-metric">
                  <span className="metric-label">{t('dashboard.latency')}:</span>
                  <span className="metric-value" data-testid={`service-latency-${serviceName}`}>
                    {serviceData.latency} ms
                  </span>
                </div>
              )}
              {serviceData.connections && (
                <div className="service-metric">
                  <span className="metric-label">{t('dashboard.connections')}:</span>
                  <span className="metric-value" data-testid={`service-connections-${serviceName}`}>
                    {serviceData.connections}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealthCard;