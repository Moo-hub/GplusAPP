import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../src/contexts/AuthContext';
import EnvironmentalDashboard from '../src/components/EnvironmentalDashboard';

// Mock dependencies
jest.mock('axios');
jest.mock('../src/contexts/AuthContext');
jest.mock('recharts', () => {
  // Mock recharts components
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children, ...props }) => (
      <div data-testid="mock-responsive-container" {...props}>
        {children}
      </div>
    ),
    LineChart: ({ children }) => <div data-testid="mock-line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="mock-bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="mock-pie-chart">{children}</div>,
    Line: () => <div data-testid="mock-line" />,
    Bar: () => <div data-testid="mock-bar" />,
    Pie: () => <div data-testid="mock-pie" />,
    XAxis: () => <div data-testid="mock-x-axis" />,
    YAxis: () => <div data-testid="mock-y-axis" />,
    CartesianGrid: () => <div data-testid="mock-cartesian-grid" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
    Legend: () => <div data-testid="mock-legend" />,
  };
});

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

const mockPersonalData = {
  user_id: 123,
  all_time: {
    weight_kg: 125.5,
    carbon_savings_kg: 312.75,
    water_savings_liters: 2450.0,
    energy_savings_kwh: 670.2,
    pickups_completed: 15
  },
  this_month: {
    weight_kg: 25.5,
    carbon_savings_kg: 63.75,
    water_savings_liters: 510.0,
    energy_savings_kwh: 135.2,
    pickups_completed: 3
  },
  growth: {
    carbon_percent: 12.5,
    weight_percent: 8.2
  },
  rank: 3,
  equivalences: {
    carbon: {
      car_kilometers: 531.2,
      trees_monthly_absorption: 85.0,
      meat_meals: 25.5
    },
    water: {
      shower_minutes: 51.0,
      toilet_flushes: 85.0,
      drinking_water_days: 255.0
    }
  },
  top_materials: [
    {
      name: "paper",
      weight: 45.2,
      percentage: 36.0,
      carbon_saved: 81.36,
      icon: "paper_icon"
    },
    {
      name: "plastic",
      weight: 35.5,
      percentage: 28.3,
      carbon_saved: 110.05,
      icon: "plastic_icon"
    },
    {
      name: "glass",
      weight: 28.4,
      percentage: 22.6,
      carbon_saved: 8.52,
      icon: "glass_icon"
    }
  ]
};

const mockCommunityData = {
  period: {
    start_date: "2023-06-01T00:00:00Z",
    end_date: "2023-06-30T23:59:59Z"
  },
  totals: {
    weight_kg: 1250.5,
    pickups_completed: 152,
    unique_contributors: 47,
    materials_count: 8
  },
  impact: {
    carbon_savings_kg: 3125.75,
    water_savings_liters: 24500.0,
    energy_savings_kwh: 6702.5
  },
  equivalences: {
    carbon: {
      car_kilometers: 5312.5,
      trees_monthly_absorption: 850.0,
      meat_meals: 255.0
    },
    water: {
      shower_minutes: 2450.0,
      toilet_flushes: 4083.0,
      drinking_water_days: 12250.0
    }
  },
  material_breakdown: [
    {
      name: "paper",
      weight: 452.3,
      percentage: 36.2,
      carbon_saved: 814.14,
      icon: "paper_icon"
    },
    {
      name: "plastic",
      weight: 355.8,
      percentage: 28.5,
      carbon_saved: 1102.98,
      icon: "plastic_icon"
    }
  ]
};

const mockTrendData = {
  metric: "carbon_savings_kg",
  time_range: "month",
  granularity: "day",
  data: [
    { date: "2023-06-01", value: 12.5 },
    { date: "2023-06-02", value: 8.2 },
    { date: "2023-06-03", value: 15.7 }
  ]
};

const mockLeaderboardData = {
  time_period: "month",
  metric: "carbon_savings_kg",
  leaderboard: [
    { position: 1, user_id: 456, user_name: "Jane Smith", value: 125.5 },
    { position: 2, user_id: 789, user_name: "Bob Johnson", value: 98.2 },
    { position: 3, user_id: 123, user_name: "John Doe", value: 87.5 },
  ]
};

describe('EnvironmentalDashboard', () => {
  beforeEach(() => {
    // Set up mocks
    localStorage.setItem('userId', '123');
    useAuth.mockReturnValue({
      currentUser: { id: 123, name: 'John Doe' },
    });
    
    // Reset axios mocks
    axios.get.mockReset();
  });

  test('renders dashboard title and tabs', () => {
    axios.get.mockResolvedValueOnce({ data: mockPersonalData });
    axios.get.mockResolvedValueOnce({ data: mockTrendData });
    
    render(
      <MemoryRouter>
        <EnvironmentalDashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByText('environmental.dashboardTitle')).toBeInTheDocument();
    expect(screen.getByText('environmental.personalImpact')).toBeInTheDocument();
    expect(screen.getByText('environmental.communityImpact')).toBeInTheDocument();
  });

  test('displays loading indicator when loading data', () => {
    // Don't resolve the promises yet
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <EnvironmentalDashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays personal impact data when loaded', async () => {
    axios.get.mockResolvedValueOnce({ data: mockPersonalData });
    axios.get.mockResolvedValueOnce({ data: mockTrendData });
    
    render(
      <MemoryRouter>
        <EnvironmentalDashboard />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('environmental.carbonSaved')).toBeInTheDocument();
      expect(screen.getByText('environmental.waterSaved')).toBeInTheDocument();
      expect(screen.getByText('environmental.communityRank')).toBeInTheDocument();
    });
    
    // Check for rendered data
    expect(screen.getByText('environmental.carbonEquivalence')).toBeInTheDocument();
    expect(screen.getByText('environmental.materialsBreakdown')).toBeInTheDocument();
    expect(screen.getByText('environmental.allTimeImpact')).toBeInTheDocument();
  });

  test('displays community impact data when switching tabs', async () => {
    // For personal tab
    axios.get.mockResolvedValueOnce({ data: mockPersonalData });
    axios.get.mockResolvedValueOnce({ data: mockTrendData });
    
    // For community tab
    axios.get.mockResolvedValueOnce({ data: mockCommunityData });
    axios.get.mockResolvedValueOnce({ data: mockLeaderboardData });
    
    const { getByText } = render(
      <MemoryRouter>
        <EnvironmentalDashboard />
      </MemoryRouter>
    );
    
    // Wait for personal data to load first
    await waitFor(() => {
      expect(screen.getByText('environmental.carbonSaved')).toBeInTheDocument();
    });
    
    // Switch to community tab
    const communityTab = getByText('environmental.communityImpact');
    communityTab.click();
    
    // Wait for community data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(4);
      expect(screen.getByText('environmental.communityCarbonSaved')).toBeInTheDocument();
      expect(screen.getByText('environmental.communityWaterSaved')).toBeInTheDocument();
      expect(screen.getByText('environmental.activeUsers')).toBeInTheDocument();
    });
  });

  test('displays error message when data loading fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <MemoryRouter>
        <EnvironmentalDashboard />
      </MemoryRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('environmental.fetchError')).toBeInTheDocument();
    });
  });
});