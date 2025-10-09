import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getRedisMemoryMetrics, 
  getRedisKeyPatterns, 
  getApiPerformanceMetrics,
  getSystemHealthMetrics 
} from '../../api/metrics';
import './PerformanceDashboard.css';

// Components
import MemoryUsageCard from './cards/MemoryUsageCard';
import ApiPerformanceCard from './cards/ApiPerformanceCard';
import KeyPatternCard from './cards/KeyPatternCard';
import SystemHealthCard from './cards/SystemHealthCard';

const PerformanceDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // State for metrics
  const [memoryMetrics, setMemoryMetrics] = useState(null);
  const [keyPatterns, setKeyPatterns] = useState(null);
  const [apiPerformance, setApiPerformance] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Load all metrics data
  const loadAllMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all metrics in parallel
      const [memory, keys, api, health] = await Promise.all([
        getRedisMemoryMetrics(),
        getRedisKeyPatterns(),
        getApiPerformanceMetrics(),
        getSystemHealthMetrics()
      ]);
      
      setMemoryMetrics(memory);
      setKeyPatterns(keys);
      setApiPerformance(api);
      setSystemHealth(health);
    } catch (err) {
      setError(err.message || 'Failed to load metrics data');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    loadAllMetrics();
    
    // Set up auto-refresh if interval > 0
    if (refreshInterval > 0) {
      const timer = setInterval(loadAllMetrics, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [refreshInterval]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    loadAllMetrics();
  };
  
  // Change refresh interval
  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value, 10);
    setRefreshInterval(newInterval);
  };

  if (loading && !memoryMetrics) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner"></div>
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container error">
        <h2>{t('dashboard.error')}</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} className="refresh-button">
          {t('dashboard.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t('dashboard.performanceTitle')}</h1>
        <div className="dashboard-controls">
          <select 
            value={refreshInterval} 
            onChange={handleIntervalChange}
            className="refresh-select"
          >
            <option value="0">{t('dashboard.noAutoRefresh')}</option>
            <option value="10000">10 {t('dashboard.seconds')}</option>
            <option value="30000">30 {t('dashboard.seconds')}</option>
            <option value="60000">1 {t('dashboard.minute')}</option>
            <option value="300000">5 {t('dashboard.minutes')}</option>
          </select>
          <button onClick={handleRefresh} className="refresh-button">
            {t('dashboard.refresh')}
          </button>
        </div>
      </div>

      <div className="dashboard-summary">
        <SystemHealthCard data={systemHealth} />
      </div>

      <div className="dashboard-grid">
        {/* Redis Memory Usage */}
        <div className="dashboard-card">
          <MemoryUsageCard data={memoryMetrics} />
        </div>

        {/* API Performance Overview */}
        <div className="dashboard-card">
          <ApiPerformanceCard data={apiPerformance} />
        </div>

        {/* Key Pattern Usage */}
        <div className="dashboard-card large-card">
          <KeyPatternCard data={keyPatterns} />
        </div>
      </div>
      
      {/* Endpoint Performance Details */}
      {apiPerformance && (
        <div className="endpoints-table">
          <h2>{t('dashboard.endpointPerformance')}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('dashboard.endpoint')}</th>
                <th>{t('dashboard.avgResponseTime')}</th>
                <th>{t('dashboard.cacheHitRatio')}</th>
                <th>{t('dashboard.requestsCount')}</th>
              </tr>
            </thead>
            <tbody>
              {apiPerformance.endpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td>{endpoint.path}</td>
                  <td>{endpoint.avg_response_time.toFixed(1)} ms</td>
                  <td>{(endpoint.cache_hit_ratio * 100).toFixed(1)}%</td>
                  <td>{endpoint.requests_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="dashboard-footer">
        <p>
          {t('dashboard.lastUpdated')}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PerformanceDashboard;