import React from 'react';
import { Card, Row, Col, Tabs, Spin, Alert, Select, Empty } from 'antd';
import { LineChartOutlined, BarChartOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';

import { useTranslation } from 'react-i18next';
const { TabPane } = Tabs;
const { Option } = Select;

export function EnvironmentalDashboardView({
  loading,
  error,
  personalData,
  communityData,
  leaderboardData,
  activeTab,
  onTabChange,
  timeRange,
  onTimeRangeChange
}) {
  const { t } = useTranslation('environmental');

  // Simple presentational helpers (kept minimal so tests don't depend on chart libs)
  const renderPersonalSummary = () => {
    if (!personalData) return <Empty description={t('noPersonalData')} />;
    return (
      <Card>
        <h3>{t('personal.totalRecycled')}: {personalData.total_recycled_kg ?? 0} kg</h3>
        <p>{t('personal.pickups')}: {personalData.total_pickups ?? 0}</p>
      </Card>
    );
  };

  const renderCommunitySummary = () => {
    if (!communityData) return <Empty description={t('noCommunityData')} />;
    return (
      <Card>
        <h3>{t('community.totalRecycled')}: {communityData.total_recycled_kg ?? 0} kg</h3>
        <p>{t('community.uniqueParticipants')}: {communityData.unique_participants ?? 0}</p>
      </Card>
    );
  };

  const renderLeaderboard = () => {
    if (!leaderboardData || leaderboardData.length === 0) return <Empty description={t('noLeaderboard')} />;
    return (
      <Card>
        <ol>
          {leaderboardData.map((item) => (
            <li key={item.position}>{item.user_name} — {item.value}</li>
          ))}
        </ol>
      </Card>
    );
  };

  // Loading / error states
  if (loading) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: 40 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
      </div>
    );
  }
  if (error) {
    return <Alert type="error" message={error?.message ?? String(error)} />;
  }

  return (
    <div className="environmental-dashboard">
      <h1 className="dashboard-title">
        <InfoCircleOutlined className="dashboard-title-icon" />
        {t('dashboardTitle')}
      </h1>
      <Tabs activeKey={activeTab} onChange={onTabChange}>
        <TabPane tab={t('personalImpact')} key="personal">
          {renderPersonalSummary()}
        </TabPane>
        <TabPane tab={t('communityImpact')} key="community">
          <Row gutter={16}>
            <Col span={16}>{renderCommunitySummary()}</Col>
            <Col span={8}>{renderLeaderboard()}</Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
