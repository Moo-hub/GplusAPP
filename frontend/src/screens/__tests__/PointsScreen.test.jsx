import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PointsScreen from '../Points/PointsScreen';
import { getPoints } from '../../api/points';

// Mock API module
jest.mock('../../api/points');

describe('PointsScreen', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  it('renders points data when API call succeeds', async () => {
    // Setup mock response
    getPoints.mockResolvedValue({
      balance: 1200,
      impact: '~8kg CO₂',
      reward: '20% off next pickup'
    });

    render(<PointsScreen />);

    // Check loading state first
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Verify data appears
    await waitFor(() => {
      expect(screen.getByText('1200')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Carbon Impact: ~8kg CO₂')).toBeInTheDocument();
    expect(screen.getByText('Reward: 20% off next pickup')).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    // Setup mock to reject
    getPoints.mockRejectedValue(new Error('Failed to load points'));

    render(<PointsScreen />);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Could not load points data')).toBeInTheDocument();
  });
});