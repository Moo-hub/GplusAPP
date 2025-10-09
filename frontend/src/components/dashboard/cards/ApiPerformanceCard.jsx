// React is used implicitly for JSX
import { useTranslation } from 'react-i18next';
import './Cards.css';

const ApiPerformanceCard = ({ data }) => {
  const { t } = useTranslation();
  
  if (!data) {
    return (
      <div className="metric-card skeleton" data-testid="api-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }
  
  // Get color for response time
  const getResponseTimeColor = (time) => {
    if (time < 30) return 'green';
    if (time < 100) return 'gold';
    if (time < 500) return 'orange';
    return 'red';
  };
  
  // Get color for cache hit ratio
  const getCacheHitColor = (ratio) => {
    if (ratio > 0.9) return 'green';
    if (ratio > 0.7) return 'gold';
    if (ratio > 0.5) return 'orange';
    return 'red';
  };
  
  return (
    <div className="metric-card" data-testid="api-performance-card">
      <h3>{t('dashboard.apiPerformance')}</h3>
      
      <div className="performance-stats">
        <div className="performance-stat">
          <div 
            className="stat-value" 
            data-testid="response-time-value"
            style={{ color: getResponseTimeColor(data.overall.avg_response_time) }}
          >
            {data.overall.avg_response_time.toFixed(1)}
            <span className="stat-unit">ms</span>
          </div>
          <div className="stat-label">{t('dashboard.avgResponseTime')}</div>
        </div>
        
        <div className="performance-stat">
          <div 
            className="stat-value" 
            data-testid="cache-hit-value"
            style={{ color: getCacheHitColor(data.overall.cache_hit_ratio) }}
          >
            {(data.overall.cache_hit_ratio * 100).toFixed(1)}
            <span className="stat-unit">%</span>
          </div>
          <div className="stat-label">{t('dashboard.cacheHitRatio')}</div>
        </div>
        
        <div className="performance-stat">
          <div className="stat-value" data-testid="request-rate-value">
            {data.overall.requests_per_minute}
            <span className="stat-unit">/min</span>
          </div>
          <div className="stat-label">{t('dashboard.requestRate')}</div>
        </div>
      </div>
      
      <div className="performance-summary" data-testid="performance-summary">
        <h4>{t('dashboard.topEndpoints')}</h4>
        <div className="top-endpoints" data-testid="top-endpoints">
          {data.endpoints.slice(0, 3).map((endpoint, index) => (
            <div key={index} className="top-endpoint" data-testid={`top-endpoint-${index}`}>
              <div className="endpoint-path" data-testid={`top-endpoint-path-${index}`}>{endpoint.path}</div>
              <div className="endpoint-stats">
                <span 
                  className="endpoint-stat" 
                  data-testid={`top-endpoint-response-time-${index}`}
                  style={{ color: getResponseTimeColor(endpoint.avg_response_time) }}
                >
                  {endpoint.avg_response_time.toFixed(1)}ms
                </span>
                <span 
                  className="endpoint-stat" 
                  data-testid={`top-endpoint-cache-ratio-${index}`}
                  style={{ color: getCacheHitColor(endpoint.cache_hit_ratio) }}
                >
                  {(endpoint.cache_hit_ratio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiPerformanceCard;