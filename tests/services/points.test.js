import { describe, it, expect, vi, beforeEach } from 'vitest';
import PointsService from '../../src/services/points';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Import the mocked API
import api from '../../src/services/api';

describe('PointsService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  describe('getUserPoints', () => {
    it('should fetch user points information', async () => {
      // Setup
      const mockPointsData = {
        totalPoints: 500,
        tier: 'Silver',
        pointsToNextTier: 250
      };
      api.get.mockResolvedValue({ data: mockPointsData });

      // Execute
      const result = await PointsService.getUserPoints();

      // Verify
      expect(api.get).toHaveBeenCalledWith('/points');
      expect(result).toEqual(mockPointsData);
    });

    it('should propagate errors', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Authentication required'));

      // Execute & Verify
      await expect(PointsService.getUserPoints()).rejects.toThrow('Authentication required');
    });
  });

  describe('getTransactionHistory', () => {
    it('should fetch points transaction history', async () => {
      // Setup
      const mockTransactions = [
        { id: 1, type: 'earned', points: 50, source: 'recycling', date: '2023-05-01T10:30:00Z' },
        { id: 2, type: 'redeemed', points: 100, item: 'Discount Coupon', date: '2023-05-10T14:45:00Z' }
      ];
      api.get.mockResolvedValue({ data: mockTransactions });

      // Execute
      const result = await PointsService.getTransactionHistory();

      // Verify
      expect(api.get).toHaveBeenCalledWith('/points/history');
      expect(result).toEqual(mockTransactions);
    });

    it('should propagate errors', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Failed to fetch history'));

      // Execute & Verify
      await expect(PointsService.getTransactionHistory()).rejects.toThrow('Failed to fetch history');
    });
  });

  describe('addPoints', () => {
    it('should add points to user account', async () => {
      // Setup
      const pointsData = {
        points: 75,
        source: 'plastic recycling',
        pickupId: 5
      };
      const mockResponse = {
        success: true,
        newTotal: 575,
        transaction: {
          id: 3,
          type: 'earned',
          points: 75,
          source: 'plastic recycling',
          date: '2023-05-21T09:15:00Z'
        }
      };
      api.post.mockResolvedValue({ data: mockResponse });

      // Execute
      const result = await PointsService.addPoints(pointsData);

      // Verify
      expect(api.post).toHaveBeenCalledWith('/points', pointsData);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors when adding points fails', async () => {
      // Setup
      const invalidData = { points: -50 };
      api.post.mockRejectedValue(new Error('Invalid points value'));

      // Execute & Verify
      await expect(PointsService.addPoints(invalidData)).rejects.toThrow('Invalid points value');
    });
  });
});