import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Spin, Alert, Button, Select, Empty } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingOutlined, LineChartOutlined, PieChartOutlined, BarChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import './EnvironmentalDashboard.css';

const { TabPane } = Tabs;
const { Option } = Select;

const EnvironmentalDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [personalData, setPersonalData] = useState(null);
  const [communityData, setCommunityData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  
  const userId = localStorage.getItem('userId');

  // Colors for charts
  const chartColors = {
    carbon: '#4CAF50',
    water: '#2196F3',
    energy: '#FFC107',
    materials: [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/v1/environmental-impact/impact');
        const data = response.data;
        setPersonalData(data.personal);
        setCommunityData(data.community);
        setLeaderboardData(data.leaderboard);
        // Optionally, set trendData if included in the response structure
      } catch (err) {
        console.error('Error fetching environmental impact data:', err);
        setError(t('environmental.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  // Render carbon savings equivalent card
  const renderCarbonEquivalenceCard = (equivalence) => {
    if (!equivalence) return null;
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.carKilometers')}</h4>
            <p className="equivalence-value">{equivalence.car_kilometers}</p>
            <p className="equivalence-label">{t('environmental.kmDriven')}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.treesMonthly')}</h4>
            <p className="equivalence-value">{equivalence.trees_monthly_absorption}</p>
            <p className="equivalence-label">{t('environmental.treesAbsorbing')}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.meatMeals')}</h4>
            <p className="equivalence-value">{equivalence.meat_meals}</p>
            <p className="equivalence-label">{t('environmental.mealsAvoided')}</p>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render water savings equivalent card
  const renderWaterEquivalenceCard = (equivalence) => {
    if (!equivalence) return null;
    
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.showerMinutes')}</h4>
            <p className="equivalence-value">{equivalence.shower_minutes}</p>
            <p className="equivalence-label">{t('environmental.minutesShowering')}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.toiletFlushes')}</h4>
            <p className="equivalence-value">{equivalence.toilet_flushes}</p>
            <p className="equivalence-label">{t('environmental.flushes')}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="equivalence-card">
            <h4>{t('environmental.drinkingDays')}</h4>
            <p className="equivalence-value">{equivalence.drinking_water_days}</p>
            <p className="equivalence-label">{t('environmental.daysOfWater')}</p>
          </Card>
        </Col>
      </Row>
    );
  };

  // Render materials breakdown pie chart
  const renderMaterialsChart = (materials) => {
    if (!materials || materials.length === 0) return <Empty description={t('environmental.noMaterials')} />;
    
    // Format data for pie chart
    const chartData = materials.map((material, index) => ({
      name: t(`materials.${material.name.toLowerCase()}`),
      value: material.weight,
      fill: chartColors.materials[index % chartColors.materials.length]
    }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          />
          <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render trend chart
  const renderTrendChart = (data) => {
    if (!data || !data.data || data.data.length === 0) {
      return <Empty description={t('environmental.noTrendData')} />;
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={chartColors.carbon} 
            name={t('environmental.carbonSavings')}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render leaderboard
  const renderLeaderboard = (data) => {
    if (!data || !data.leaderboard || data.leaderboard.length === 0) {
      return <Empty description={t('environmental.noLeaderboardData')} />;
    }
    
    return (
      <div className="leaderboard-container">
        {data.leaderboard.map((entry) => (
          <div 
            key={entry.user_id} 
            className={`leaderboard-entry ${entry.user_id === parseInt(userId) ? 'current-user' : ''}`}
          >
            <div className="leaderboard-rank">{entry.position}</div>
            <div className="leaderboard-name">{entry.user_name}</div>
            <div className="leaderboard-value">
              {entry.value.toFixed(2)} {data.metric === 'carbon_savings_kg' ? 'kg CO₂' : 'kg'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render personal impact tab content
  const renderPersonalTab = () => {
    if (loading) {
      return <div className="loading-container"><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div>;
    }
    
    if (error) {
      return <Alert type="error" message={error} />;
    }
    
    if (!personalData) {
      return <Empty description={t('environmental.noPersonalData')} />;
    }
    
    const { all_time, this_month, growth, rank, top_materials } = personalData;
    
    return (
      <div className="dashboard-content">
        <Row gutter={[16, 24]}>
          {/* Summary Cards */}
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon carbon-icon"><LineChartOutlined /></div>
              <h3>{t('environmental.carbonSaved')}</h3>
              <p className="metric-value">{this_month.carbon_savings_kg.toFixed(2)} kg</p>
              <p className={`metric-change ${growth.carbon_percent >= 0 ? 'positive' : 'negative'}`}>
                {growth.carbon_percent >= 0 ? '+' : ''}{growth.carbon_percent.toFixed(1)}%
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon water-icon"><LineChartOutlined /></div>
              <h3>{t('environmental.waterSaved')}</h3>
              <p className="metric-value">{this_month.water_savings_liters.toFixed(0)} L</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon rank-icon"><BarChartOutlined /></div>
              <h3>{t('environmental.communityRank')}</h3>
              <p className="metric-value">#{rank || '-'}</p>
            </Card>
          </Col>
        </Row>
        
        {/* Carbon Savings Equivalences */}
        <Card title={t('environmental.carbonEquivalence')} className="dashboard-card">
          {renderCarbonEquivalenceCard(personalData.equivalences?.carbon)}
        </Card>
        
        {/* Materials Breakdown */}
        <Card title={t('environmental.materialsBreakdown')} className="dashboard-card">
          {renderMaterialsChart(top_materials)}
        </Card>
        
        {/* Trend Chart */}
        <Card title={t('environmental.trendChart')} className="dashboard-card">
          {trendData ? renderTrendChart(trendData) : <Empty description={t('environmental.noTrendData')} />}
        </Card>
        
        {/* All-time Impact */}
        <Card title={t('environmental.allTimeImpact')} className="dashboard-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="all-time-stat">
                <h4>{t('environmental.totalRecycled')}</h4>
                <p className="all-time-value">{all_time.weight_kg.toFixed(1)} kg</p>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="all-time-stat">
                <h4>{t('environmental.totalCarbon')}</h4>
                <p className="all-time-value">{all_time.carbon_savings_kg.toFixed(1)} kg</p>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="all-time-stat">
                <h4>{t('environmental.completedPickups')}</h4>
                <p className="all-time-value">{all_time.pickups_completed}</p>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // Render community impact tab content
  const renderCommunityTab = () => {
    if (loading) {
      return <div className="loading-container"><Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /></div>;
    }
    
    if (error) {
      return <Alert type="error" message={error} />;
    }
    
    if (!communityData) {
      return <Empty description={t('environmental.noCommunityData')} />;
    }
    
    return (
      <div className="dashboard-content">
        <Row gutter={[16, 24]}>
          {/* Summary Cards */}
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon carbon-icon"><LineChartOutlined /></div>
              <h3>{t('environmental.communityCarbonSaved')}</h3>
              <p className="metric-value">{communityData.impact.carbon_savings_kg.toFixed(2)} kg</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon water-icon"><LineChartOutlined /></div>
              <h3>{t('environmental.communityWaterSaved')}</h3>
              <p className="metric-value">{communityData.impact.water_savings_liters.toFixed(0)} L</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="metric-card">
              <div className="metric-icon users-icon"><BarChartOutlined /></div>
              <h3>{t('environmental.activeUsers')}</h3>
              <p className="metric-value">{communityData.totals.unique_contributors}</p>
            </Card>
          </Col>
        </Row>
        
        {/* Community Carbon Equivalences */}
        <Card title={t('environmental.communityCarbonEquivalence')} className="dashboard-card">
          {renderCarbonEquivalenceCard(communityData.equivalences?.carbon)}
        </Card>
        
        {/* Community Water Equivalences */}
        <Card title={t('environmental.communityWaterEquivalence')} className="dashboard-card">
          {renderWaterEquivalenceCard(communityData.equivalences?.water)}
        </Card>
        
        {/* Materials Breakdown */}
        <Card title={t('environmental.materialsBreakdown')} className="dashboard-card">
          {renderMaterialsChart(communityData.material_breakdown)}
        </Card>
        
        {/* Leaderboard */}
        <Card 
          title={t('environmental.leaderboard')}
          className="dashboard-card"
          extra={
            <Select 
              defaultValue="month" 
              style={{ width: 120 }} 
              onChange={handleTimeRangeChange}
            >
              <Option value="week">{t('environmental.pastWeek')}</Option>
              <Option value="month">{t('environmental.pastMonth')}</Option>
              <Option value="year">{t('environmental.pastYear')}</Option>
              <Option value="all">{t('environmental.allTime')}</Option>
            </Select>
          }
        >
          {leaderboardData ? renderLeaderboard(leaderboardData) : <Empty description={t('environmental.noLeaderboardData')} />}
        </Card>
      </div>
    );
  };

  return (
    <div className="environmental-dashboard">
      <h1 className="dashboard-title">
        <InfoCircleOutlined className="dashboard-title-icon" />
        {t('environmental.dashboardTitle')}
      </h1>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
      >
        <TabPane tab={t('environmental.personalImpact')} key="personal">
          {renderPersonalTab()}
        </TabPane>
        <TabPane tab={t('environmental.communityImpact')} key="community">
          {renderCommunityTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnvironmentalDashboard;