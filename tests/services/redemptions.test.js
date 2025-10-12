import { vi, describe, it, expect, beforeEach } from 'vitest';
import RedemptionsService from '../../src/services/redemptions';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

// Import the mocked api
import api from '../../src/services/api';

describe('RedemptionsService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  
  describe('getUserRedemptions', () => {
    it('should fetch user redemptions without params by default', async () => {
      // Mock data
      const mockRedemptions = [
        {
          id: 1,
          user_id: 1,
          option_id: 2,
          points: 500,
          status: 'completed',
          created_at: '2025-09-15T10:30:00Z',
          option: { name: '$5 GreenMart Gift Card' }
        },
        {
          id: 2,
          user_id: 1,
          option_id: 3,
          points: 1000,
          status: 'pending',
          created_at: '2025-09-20T14:45:00Z',
          option: { name: '$10 EcoStore Voucher' }
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockRedemptions });
      
      // Call the method
      const result = await RedemptionsService.getUserRedemptions();
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemptions', { params: {} });
      
      // Verify the result
      expect(result).toEqual(mockRedemptions);
    });
    
    it('should fetch user redemptions with specified params', async () => {
      // Mock data
      const mockRedemptions = [
        {
          id: 1,
          user_id: 1,
          option_id: 2,
          points: 500,
          status: 'completed',
          created_at: '2025-09-15T10:30:00Z',
          option: { name: '$5 GreenMart Gift Card' }
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockRedemptions });
      
      // Call the method with params
      const params = { status: 'completed', limit: 5 };
      const result = await RedemptionsService.getUserRedemptions(params);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemptions', { params });
      
      // Verify the result
      expect(result).toEqual(mockRedemptions);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Failed to fetch redemptions');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionsService.getUserRedemptions()).rejects.toThrow('Failed to fetch redemptions');
    });
  });
  
  describe('getRedemption', () => {
    it('should fetch a specific redemption by id', async () => {
      // Mock data
      const mockRedemption = {
        id: 1,
        user_id: 1,
        option_id: 2,
        points: 500,
        status: 'completed',
        created_at: '2025-09-15T10:30:00Z',
        completed_at: '2025-09-15T10:35:00Z',
        option: { 
          name: '$5 GreenMart Gift Card',
          partner: {
            name: 'GreenMart',
            logo_url: 'https://example.com/greenmart.png'
          }
        }
      };
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockRedemption });
      
      // Call the method
      const result = await RedemptionsService.getRedemption(1);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemptions/1');
      
      // Verify the result
      expect(result).toEqual(mockRedemption);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Redemption not found');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionsService.getRedemption(999)).rejects.toThrow('Redemption not found');
    });
  });
  
  describe('redeemPoints', () => {
    it('should redeem points for an option', async () => {
      // Mock data
      const optionId = 5;
      const mockResponse = {
        id: 3,
        user_id: 1,
        option_id: optionId,
        points: 750,
        status: 'pending',
        created_at: '2025-09-29T16:20:00Z',
        option: { name: '$7.50 EcoStore Voucher' }
      };
      
      // Mock API response
      api.post.mockResolvedValueOnce({ data: mockResponse });
      
      // Call the method
      const result = await RedemptionsService.redeemPoints(optionId);
      
      // Verify the API was called correctly
      expect(api.post).toHaveBeenCalledWith('/redemptions', { option_id: optionId });
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Insufficient points');
      api.post.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionsService.redeemPoints(10)).rejects.toThrow('Insufficient points');
    });
  });
  
  describe('cancelRedemption', () => {
    it('should cancel a pending redemption', async () => {
      // Mock data
      const redemptionId = 2;
      const mockResponse = {
        id: redemptionId,
        user_id: 1,
        option_id: 3,
        points: 1000,
        status: 'cancelled',
        created_at: '2025-09-20T14:45:00Z',
        cancelled_at: '2025-09-29T16:25:00Z',
        option: { name: '$10 EcoStore Voucher' }
      };
      
      // Mock API response
      api.put.mockResolvedValueOnce({ data: mockResponse });
      
      // Call the method
      const result = await RedemptionsService.cancelRedemption(redemptionId);
      
      // Verify the API was called correctly
      expect(api.put).toHaveBeenCalledWith(`/redemptions/${redemptionId}/cancel`);
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Cannot cancel completed redemption');
      api.put.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionsService.cancelRedemption(1)).rejects.toThrow('Cannot cancel completed redemption');
    });
  });
});