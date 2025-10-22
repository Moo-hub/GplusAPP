import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
// Mock service module with Vitest (PointsScreen imports from services/pointsService)
vi.mock('../../services/pointsService', () => ({
  getPoints: vi.fn(),
  getPointsHistory: vi.fn(),
  getImpactData: vi.fn(),
}));
import { getPoints } from '../../services/pointsService';
/** @type {any} */
const mockedGetPoints = getPoints;

describe('PointsScreen', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('renders points data when API call succeeds', async () => {
    // Setup mock response (one-time)
    mockedGetPoints.mockResolvedValueOnce({
      balance: 1200,
      impact: '~8kg CO₂',
      reward: '20% off next pickup'
    });

    render(<PointsScreen />);

    // Check loading state first
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Verify data appears - match by content fragments to avoid relying on translations
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('~8kg CO₂'))).toBeInTheDocument();
    });
    expect(screen.getByText((content) => content.includes('20% off next pickup'))).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
  // Setup mock to reject (one-time)
  mockedGetPoints.mockRejectedValueOnce(new Error('Failed to load points'));

    render(<PointsScreen />);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
  // Accept translated key or English text
  expect(screen.getByText(/Could not load points data|points\.error/i)).toBeInTheDocument();
  });
});