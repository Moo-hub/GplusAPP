
import React, { useState } from 'react';
import { useEnvironmentalImpact } from '../hooks/useEnvironmentalImpact';
import { EnvironmentalDashboardView } from './EnvironmentalDashboardView';
import { ErrorBoundary } from './ErrorBoundary';

export function EnvironmentalDashboardContainer() {
  const [activeTab, setActiveTab] = useState('personal');
  const [timeRange, setTimeRange] = useState('month');
  const {
    loading,
    error,
    personalData,
    communityData,
    leaderboardData
  } = useEnvironmentalImpact();

  return (
    <ErrorBoundary>
      <EnvironmentalDashboardView
        loading={loading}
        error={error}
        personalData={personalData}
        communityData={communityData}
        leaderboardData={leaderboardData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </ErrorBoundary>
  );
}
