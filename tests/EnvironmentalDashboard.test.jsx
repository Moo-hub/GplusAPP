import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import EnvironmentalDashboard from '../src/components/EnvironmentalDashboard';
import { vi } from 'vitest';
import renderWithProviders, { makeAuthMocks } from './test-utils.jsx';


// Mock dependencies using Vitest
vi.mock('axios');
// rely on central mock in tests/__mocks__/recharts.js via vitest config alias

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
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

// Basic smoke test for the dashboard rendering
describe('EnvironmentalDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders chart containers', async () => {
    const auth = makeAuthMocks({ currentUser: { name: 'Mock User' } });
    // Ensure userId used in the component is set
    localStorage.setItem('userId', '123');

    // Mock axios GET calls the component will make. Use a URL-based
    // implementation so the right mock data is returned regardless of call
    // ordering or extra calls.
    axios.get.mockImplementation((url) => {
      if (url && url.includes('/summary')) return Promise.resolve({ data: mockPersonalData });
      if (url && url.includes('/trend')) return Promise.resolve({ data: mockTrendData });
      if (url && url.includes('/community')) return Promise.resolve({ data: mockCommunityData });
      if (url && url.includes('/leaderboard')) return Promise.resolve({ data: mockLeaderboardData });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<EnvironmentalDashboard />, { route: '/', auth });

    const containers = await screen.findAllByTestId('mock-responsive-container');
    expect(containers.length).toBeGreaterThan(0);
  });
});