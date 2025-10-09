import React from 'react';
import { useTranslation } from 'react-i18next';
import './Cards.css';

const MemoryUsageCard = ({ data }) => {
  const { t } = useTranslation();
  
  if (!data) {
    return (
      <div className="metric-card skeleton" data-testid="memory-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }
  
  // Get color based on memory pressure
  const getMemoryColor = (pressureLevel) => {
    switch (pressureLevel) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      default:
        return 'green';
    }
  };
  
  // Get trend icon
  const getTrendIcon = (direction) => {
    if (direction === 'increasing') {
      return '↗️';
    } else if (direction === 'decreasing') {
      return '↘️';
    } else {
      return '→';
    }
  };
  
  const memoryColor = getMemoryColor(data.pressure_level);
  
  return (
    <div className="metric-card" data-testid="memory-usage-card">
      <h3>{t('dashboard.redisMemoryUsage')}</h3>
      
      <div className="memory-gauge">
        <div 
          className="memory-gauge-fill" 
          data-testid="memory-gauge-fill"
          style={{ 
            width: `${Math.min(100, data.used_percent)}%`,
            backgroundColor: memoryColor
          }}
        ></div>
        <div className="memory-gauge-text" data-testid="memory-gauge-text">
          {data.used_percent.toFixed(1)}%
        </div>
      </div>
      
      <div className="memory-details">
        <div className="memory-detail-item">
          <span className="memory-detail-label">{t('dashboard.usedMemory')}:</span>
          <span className="memory-detail-value">{data.used_memory_gb} GB</span>
        </div>
        <div className="memory-detail-item">
          <span className="memory-detail-label">{t('dashboard.totalMemory')}:</span>
          <span className="memory-detail-value">{data.max_memory_gb} GB</span>
        </div>
        <div className="memory-detail-item">
          <span className="memory-detail-label">{t('dashboard.fragmentationRatio')}:</span>
          <span className="memory-detail-value">{data.fragmentation_ratio}</span>
        </div>
        <div className="memory-detail-item">
          <span className="memory-detail-label">{t('dashboard.connectedClients')}:</span>
          <span className="memory-detail-value">{data.connected_clients}</span>
        </div>
      </div>
      
      <div className="memory-trend">
        <span className={`trend-label ${data.trend.direction}`} data-testid="trend-label">
          {getTrendIcon(data.trend.direction)} {t(`dashboard.${data.trend.direction}`)}
        </span>
        <span className="trend-rate">
          {t('dashboard.atRate')} {data.trend.rate.toFixed(2)}% / hr
        </span>
      </div>
    </div>
  );
};

export default MemoryUsageCard;