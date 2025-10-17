import { vi, describe, it, expect, beforeEach } from 'vitest';
import RedemptionOptionsService from '../../src/services/redemptionOptions';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

// Import the mocked api
import api from '../../src/services/api';

describe('RedemptionOptionsService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  
  describe('getOptions', () => {
    it('should fetch redemption options without params by default', async () => {
      // Mock data
      const mockOptions = [
        {
          id: 1,
          name: '$5 GreenMart Gift Card',
          description: 'Gift card for GreenMart stores',
          points: 500,
          is_active: true,
          partner_id: 1,
          category: 'gift_card'
        },
        {
          id: 2,
          name: '$10 EcoStore Voucher',
          description: 'Online voucher for EcoStore',
          points: 1000,
          is_active: true,
          partner_id: 2,
          category: 'voucher'
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockOptions });
      
      // Call the method
      const result = await RedemptionOptionsService.getOptions();
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemption-options', { params: {} });
      
      // Verify the result
      expect(result).toEqual(mockOptions);
    });
    
    it('should fetch redemption options with specified params', async () => {
      // Mock data
      const mockOptions = [
        {
          id: 1,
          name: '$5 GreenMart Gift Card',
          description: 'Gift card for GreenMart stores',
          points: 500,
          is_active: true,
          partner_id: 1,
          category: 'gift_card'
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockOptions });
      
      // Call the method with params
      const params = { category: 'gift_card', is_active: true };
      const result = await RedemptionOptionsService.getOptions(params);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemption-options', { params });
      
      // Verify the result
      expect(result).toEqual(mockOptions);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Failed to fetch redemption options');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionOptionsService.getOptions()).rejects.toThrow('Failed to fetch redemption options');
    });
  });
  
  describe('getOption', () => {
    it('should fetch a specific redemption option by id', async () => {
      // Mock data
      const mockOption = {
        id: 1,
        name: '$5 GreenMart Gift Card',
        description: 'Gift card for GreenMart stores',
        points: 500,
        is_active: true,
        partner_id: 1,
        category: 'gift_card',
        image_url: 'https://example.com/gift-card.png',
        partner: {
          name: 'GreenMart',
          logo_url: 'https://example.com/greenmart.png'
        }
      };
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockOption });
      
      // Call the method
      const result = await RedemptionOptionsService.getOption(1);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemption-options/1');
      
      // Verify the result
      expect(result).toEqual(mockOption);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Redemption option not found');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionOptionsService.getOption(999)).rejects.toThrow('Redemption option not found');
    });
  });
  
  describe('getOptionsByPartner', () => {
    it('should fetch redemption options for a specific partner', async () => {
      // Mock data
      const partnerId = 1;
      const mockOptions = [
        {
          id: 1,
          name: '$5 GreenMart Gift Card',
          description: 'Gift card for GreenMart stores',
          points: 500,
          is_active: true,
          partner_id: partnerId,
          category: 'gift_card'
        },
        {
          id: 3,
          name: '$20 GreenMart Gift Card',
          description: 'Gift card for GreenMart stores',
          points: 2000,
          is_active: true,
          partner_id: partnerId,
          category: 'gift_card'
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockOptions });
      
      // Call the method
      const result = await RedemptionOptionsService.getOptionsByPartner(partnerId);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemption-options', { 
        params: { 
          partner_id: partnerId,
          is_active: true
        } 
      });
      
      // Verify the result
      expect(result).toEqual(mockOptions);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Failed to fetch partner options');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionOptionsService.getOptionsByPartner(1)).rejects.toThrow('Failed to fetch partner options');
    });
  });
  
  describe('getOptionsByCategory', () => {
    it('should fetch redemption options for a specific category', async () => {
      // Mock data
      const category = 'voucher';
      const mockOptions = [
        {
          id: 2,
          name: '$10 EcoStore Voucher',
          description: 'Online voucher for EcoStore',
          points: 1000,
          is_active: true,
          partner_id: 2,
          category
        },
        {
          id: 4,
          name: '$30 TreePlant Voucher',
          description: 'Plant trees with TreePlant',
          points: 3000,
          is_active: true,
          partner_id: 3,
          category
        }
      ];
      
      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockOptions });
      
      // Call the method
      const result = await RedemptionOptionsService.getOptionsByCategory(category);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/redemption-options', { 
        params: { 
          category,
          is_active: true
        } 
      });
      
      // Verify the result
      expect(result).toEqual(mockOptions);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Failed to fetch category options');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(RedemptionOptionsService.getOptionsByCategory('donation')).rejects.toThrow('Failed to fetch category options');
    });
  });
});