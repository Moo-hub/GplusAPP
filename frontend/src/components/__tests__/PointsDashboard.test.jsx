import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PointsDashboard from '../PointsDashboard';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('PointsDashboard Component', () => {
  const mockT = vi.fn((key) => key);
  const defaultQueryResult = {
    isLoading: false,
    error: null,
    data: null,
  };

  beforeEach(() => {
    // Clear calls but keep module mock implementations intact so
    // useTranslation mockReturnValue works reliably across tests.
    vi.clearAllMocks();
    useTranslation.mockReturnValue({ t: mockT });
  });

  it('renders loading state when data is loading', async () => {
    // Mock loading state for all three queries
    useQuery.mockReturnValue({
      ...defaultQueryResult,
      isLoading: true,
    });

    render(<PointsDashboard />);

    expect(await screen.findByText('common.loading')).toBeInTheDocument();
    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error state when any query fails', async () => {
    // Mock error state
    useQuery.mockReturnValue({
      ...defaultQueryResult,
      error: new Error('Failed to fetch'),
    });

    render(<PointsDashboard />);

    expect(await screen.findByText('errors.dataLoadingError')).toBeInTheDocument();
    expect(await screen.findByText('errors.tryAgainLater')).toBeInTheDocument();
  });

  it('renders points summary data correctly', async () => {
    // Mock successful responses for all queries
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'points-summary') {
        return {
          isLoading: false,
          error: null,
          data: {
            balance: 1250,
            impact: 'High',
            reward: '$25 Gift Card',
            monthlyPoints: 350,
            streak: 7,
          }
        };
      } else if (queryKey[0] === 'points-history') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      } else if (queryKey[0] === 'impact-data') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      }
      return defaultQueryResult;
    });

    render(<PointsDashboard />);

    // Check summary section
    expect(await screen.findByText('points.summary')).toBeInTheDocument();
    expect(await screen.findByText('1250')).toBeInTheDocument();
    expect(await screen.findByText('High')).toBeInTheDocument();
    expect(await screen.findByText('$25 Gift Card')).toBeInTheDocument();
    expect(await screen.findByText('350')).toBeInTheDocument();
    expect(await screen.findByText('7 points.days')).toBeInTheDocument();
  });

  it('renders points history data correctly', async () => {
    // Mock successful responses for all queries
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'points-summary') {
        return {
          isLoading: false,
          error: null,
          data: {
            balance: 1250,
            impact: 'High',
            reward: '$25 Gift Card',
            monthlyPoints: 350,
            streak: 7,
          }
        };
      } else if (queryKey[0] === 'points-history') {
        return {
          isLoading: false,
          error: null,
          data: [
            {
              id: 1,
              created_at: '2023-05-15T10:30:00Z',
              description: 'Recycled 5kg of plastic',
              points: 100,
              type: 'earn',
              source: 'recycle',
            },
            {
              id: 2,
              created_at: '2023-05-10T14:45:00Z',
              description: 'Redeemed reward',
              points: -50,
              type: 'spend',
              source: 'reward',
            }
          ]
        };
      } else if (queryKey[0] === 'impact-data') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      }
      return defaultQueryResult;
    });

    render(<PointsDashboard />);

    // Check history section
    expect(await screen.findByText('points.history')).toBeInTheDocument();
    expect(await screen.findByText('Recycled 5kg of plastic')).toBeInTheDocument();
    expect(await screen.findByText('Redeemed reward')).toBeInTheDocument();
    expect(await screen.findByText('+100')).toBeInTheDocument();
    expect(await screen.findByText('-50')).toBeInTheDocument();
  });

  it('renders impact data correctly', async () => {
    // Mock successful responses for all queries
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'points-summary') {
        return {
          isLoading: false,
          error: null,
          data: {
            balance: 1250,
            impact: 'High',
            reward: '$25 Gift Card',
            monthlyPoints: 350,
            streak: 7,
          }
        };
      } else if (queryKey[0] === 'points-history') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      } else if (queryKey[0] === 'impact-data') {
        return {
          isLoading: false,
          error: null,
          data: [
            { label: 'co2', value: '500kg saved' },
            { label: 'water', value: '2000L conserved' }
          ]
        };
      }
      return defaultQueryResult;
    });

    render(<PointsDashboard />);

    // Check impact section
    expect(await screen.findByText('impact.title')).toBeInTheDocument();
    expect(await screen.findByText('impact.types.co2')).toBeInTheDocument();
    expect(await screen.findByText('500kg saved')).toBeInTheDocument();
    expect(await screen.findByText('impact.types.water')).toBeInTheDocument();
    expect(await screen.findByText('2000L conserved')).toBeInTheDocument();
  });

  it('renders no history message when history is empty', async () => {
    // Mock successful responses for all queries
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'points-summary') {
        return {
          isLoading: false,
          error: null,
          data: {
            balance: 1250,
            impact: 'High',
            reward: '$25 Gift Card',
            monthlyPoints: 350,
            streak: 7,
          }
        };
      } else if (queryKey[0] === 'points-history') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      } else if (queryKey[0] === 'impact-data') {
        return {
          isLoading: false,
          error: null,
          data: []
        };
      }
      return defaultQueryResult;
    });

    render(<PointsDashboard />);

    expect(await screen.findByText('points.noHistoryAvailable')).toBeInTheDocument();
  });
});