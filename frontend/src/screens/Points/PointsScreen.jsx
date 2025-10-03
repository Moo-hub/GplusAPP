import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../components/Card";
import Button from "../../components/Button";
import GenericScreen from "../../components/GenericScreen";
import CircleProgress from "../../components/CircleProgress";
import DonutChart from "../../components/charts/DonutChart";
import { getPoints, getPointsHistory, getImpactData } from "../../services/pointsService";
import "./PointsScreen.css";

export default function PointsScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');
  const [impactData, setImpactData] = useState([]);
  
  // Load impact data for the chart
  useEffect(() => {
    async function fetchImpactData() {
      try {
        const data = await getImpactData();
        setImpactData(data);
      } catch (error) {
        console.error('Failed to load impact data', error);
      }
    }
    
    if (activeTab === 'impact') {
      fetchImpactData();
    }
  }, [activeTab]);

  return (
    <GenericScreen
      apiCall={getPoints}
      titleKey={t('points.title')}
      emptyKey={t('points.empty')}
      errorKey={t('points.error')}
    >
      {(data) => (
        <div className="points-container">
          {/* Points Summary Card */}
          <Card title={t('points.summary')} variant="dark">
            <div className="points-display">
              <CircleProgress 
                value={data.balance} 
                maxValue={2000}
                color="#ffffff" 
              />
              <div className="points-details">
                <p>{t('points.impact')}: {data.impact}</p>
                <p>{t('points.reward')}: {data.reward}</p>
              </div>
            </div>
          </Card>
          
          {/* Navigation Tabs */}
          <div className="points-tabs">
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              {t('points.summaryTab')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              {t('points.historyTab')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'impact' ? 'active' : ''}`}
              onClick={() => setActiveTab('impact')}
            >
              {t('points.impactTab')}
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'summary' && (
              <Card title={t('points.actions')}>
                <div className="action-buttons">
                  <Button variant="primary">{t('points.redeem')}</Button>
                  <Button variant="secondary">{t('points.transfer')}</Button>
                </div>
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-value">{data.monthlyPoints || 0}</span>
                    <span className="stat-label">{t('points.thisMonth')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{data.streak || 0}</span>
                    <span className="stat-label">{t('points.streak')}</span>
                  </div>
                </div>
              </Card>
            )}
            
            {activeTab === 'history' && (
              <GenericScreen
                apiCall={getPointsHistory}
                emptyKey={t('points.noHistory')}
                errorKey={t('points.historyError')}
              >
                {(history) => (
                  <div className="points-history">
                    {history.map(item => (
                      <div key={item.id} className="history-item">
                        <div className="history-details">
                          <span className="history-date">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="history-title">{item.description}</span>
                        </div>
                        <span className={`history-points ${item.type === 'earn' ? 'earned' : 'spent'}`}>
                          {item.type === 'earn' ? '+' : '-'}{item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GenericScreen>
            )}
            
            {activeTab === 'impact' && (
              <Card title={t('points.environmentalImpact')}>
                <div className="impact-container">
                  {impactData.length > 0 ? (
                    <DonutChart
                      data={impactData}
                      size={250}
                      colors={['#4ade80', '#60a5fa', '#f97316', '#8b5cf6']}
                    />
                  ) : (
                    <div className="loading-chart">{t('common.loading')}</div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </GenericScreen>
  );
}