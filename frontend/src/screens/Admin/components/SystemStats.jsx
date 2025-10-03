import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import './SystemStats.css';

// Import chart library if needed
// import { Line, Bar, Doughnut } from 'react-chartjs-2';

const SystemStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/stats?timeRange=${timeRange}`);
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch system statistics');
      setLoading(false);
      toast.error(t('admin.stats.fetchError'));
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  
  if (error) return <div className="error-message">{error}</div>;

  // If we don't have stats data yet, show a placeholder
  if (!stats) {
    return (
      <div className="system-stats">
        <div className="system-stats-header">
          <h2>{t('admin.stats.title')}</h2>
          <div className="time-range-selector">
            <button 
              className={timeRange === 'week' ? 'active' : ''}
              onClick={() => setTimeRange('week')}
            >
              {t('admin.stats.week')}
            </button>
            <button 
              className={timeRange === 'month' ? 'active' : ''}
              onClick={() => setTimeRange('month')}
            >
              {t('admin.stats.month')}
            </button>
            <button 
              className={timeRange === 'year' ? 'active' : ''}
              onClick={() => setTimeRange('year')}
            >
              {t('admin.stats.year')}
            </button>
          </div>
        </div>
        <div className="stats-placeholder">
          {t('admin.stats.noData')}
        </div>
      </div>
    );
  }

  return (
    <div className="system-stats">
      <div className="system-stats-header">
        <h2>{t('admin.stats.title')}</h2>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            {t('admin.stats.week')}
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            {t('admin.stats.month')}
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            {t('admin.stats.year')}
          </button>
        </div>
      </div>

      <div className="stats-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          {t('admin.stats.overview')}
        </button>
        <button 
          className={activeTab === 'pickups' ? 'active' : ''}
          onClick={() => setActiveTab('pickups')}
        >
          {t('admin.stats.pickups')}
        </button>
        <button 
          className={activeTab === 'materials' ? 'active' : ''}
          onClick={() => setActiveTab('materials')}
        >
          {t('admin.stats.materials')}
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          {t('admin.stats.users')}
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'overview' && (
          <div className="stats-overview">
            <div className="stats-card-grid">
              <div className="stats-card">
                <div className="stats-card-title">{t('admin.stats.totalPickups')}</div>
                <div className="stats-card-value">{formatNumber(stats.totalPickups)}</div>
                <div className="stats-card-change increase">
                  +{stats.pickupGrowth}% {t('admin.stats.fromPrevious')}
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-title">{t('admin.stats.activeCompanies')}</div>
                <div className="stats-card-value">{formatNumber(stats.activeCompanies)}</div>
                <div className="stats-card-change increase">
                  +{stats.companyGrowth}% {t('admin.stats.fromPrevious')}
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-title">{t('admin.stats.materialCollected')}</div>
                <div className="stats-card-value">{formatNumber(stats.totalMaterialWeight)} kg</div>
                <div className="stats-card-change increase">
                  +{stats.materialGrowth}% {t('admin.stats.fromPrevious')}
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-title">{t('admin.stats.registeredUsers')}</div>
                <div className="stats-card-value">{formatNumber(stats.registeredUsers)}</div>
                <div className="stats-card-change increase">
                  +{stats.userGrowth}% {t('admin.stats.fromPrevious')}
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div className="stats-chart-container">
                <h3>{t('admin.stats.pickupTrends')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Line 
                    data={stats.pickupTrendData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>
              
              <div className="stats-chart-container">
                <h3>{t('admin.stats.materialDistribution')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Doughnut 
                    data={stats.materialDistributionData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pickups' && (
          <div className="stats-pickups">
            <div className="stats-row">
              <div className="stats-chart-container full-width">
                <h3>{t('admin.stats.pickupsByStatus')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Bar 
                    data={stats.pickupStatusData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div className="stats-table-container">
                <h3>{t('admin.stats.pickupTimes')}</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>{t('admin.stats.timeSlot')}</th>
                      <th>{t('admin.stats.pickupCount')}</th>
                      <th>{t('admin.stats.percentageTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pickupTimeDistribution.map((item, index) => (
                      <tr key={index}>
                        <td>{item.timeSlot}</td>
                        <td>{item.count}</td>
                        <td>{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="stats-table-container">
                <h3>{t('admin.stats.pickupsByDay')}</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>{t('admin.stats.dayOfWeek')}</th>
                      <th>{t('admin.stats.pickupCount')}</th>
                      <th>{t('admin.stats.percentageTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pickupDayDistribution.map((item, index) => (
                      <tr key={index}>
                        <td>{item.day}</td>
                        <td>{item.count}</td>
                        <td>{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="stats-materials">
            <div className="stats-row">
              <div className="stats-chart-container full-width">
                <h3>{t('admin.stats.materialsTrend')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Line 
                    data={stats.materialTrendData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div className="stats-chart-container">
                <h3>{t('admin.stats.materialTypes')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Doughnut 
                    data={stats.materialTypesData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>

              <div className="stats-table-container">
                <h3>{t('admin.stats.materialsSummary')}</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>{t('admin.stats.materialType')}</th>
                      <th>{t('admin.stats.quantity')}</th>
                      <th>{t('admin.stats.percentageTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.materialSummary.map((item, index) => (
                      <tr key={index}>
                        <td>{item.type}</td>
                        <td>{formatNumber(item.quantity)} {item.unit}</td>
                        <td>{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="stats-users">
            <div className="stats-row">
              <div className="stats-chart-container">
                <h3>{t('admin.stats.userGrowth')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Line 
                    data={stats.userGrowthData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>

              <div className="stats-chart-container">
                <h3>{t('admin.stats.userRoles')}</h3>
                <div className="chart-placeholder">
                  {/* 
                  Chart would go here using a library like Chart.js
                  <Doughnut 
                    data={stats.userRolesData} 
                    options={chartOptions} 
                  /> 
                  */}
                  {t('admin.stats.chartPlaceholder')}
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div className="stats-table-container full-width">
                <h3>{t('admin.stats.userActivity')}</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>{t('admin.stats.metricName')}</th>
                      <th>{t('admin.stats.count')}</th>
                      <th>{t('admin.stats.change')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{t('admin.stats.newUsers')}</td>
                      <td>{formatNumber(stats.userActivity.newUsers)}</td>
                      <td className="change increase">+{stats.userActivity.newUsersChange}%</td>
                    </tr>
                    <tr>
                      <td>{t('admin.stats.activeUsers')}</td>
                      <td>{formatNumber(stats.userActivity.activeUsers)}</td>
                      <td className="change increase">+{stats.userActivity.activeUsersChange}%</td>
                    </tr>
                    <tr>
                      <td>{t('admin.stats.pickupRequests')}</td>
                      <td>{formatNumber(stats.userActivity.pickupRequests)}</td>
                      <td className="change increase">+{stats.userActivity.pickupRequestsChange}%</td>
                    </tr>
                    <tr>
                      <td>{t('admin.stats.logins')}</td>
                      <td>{formatNumber(stats.userActivity.logins)}</td>
                      <td className="change increase">+{stats.userActivity.loginsChange}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stats-footer">
        <button className="refresh-button" onClick={fetchStats}>
          {t('common.refresh')}
        </button>
        <div className="last-updated">
          {t('admin.stats.lastUpdated')}: {new Date(stats.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default SystemStats;