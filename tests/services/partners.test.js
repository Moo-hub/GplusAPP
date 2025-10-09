import { vi, describe, it, expect, beforeEach } from 'vitest';
import PartnersService from '../../src/services/partners';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

// Import the mocked api
import api from '../../src/services/api';

describe('PartnersService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  
  describe('getPartners', () => {
    it('should fetch active partners by default', async () => {
      // Mock data
      const mockPartners = [
        { id: 1, name: 'GreenMart', is_active: true },
        { id: 2, name: 'EcoStore', is_active: true }
      ];
      
      // Mock API response
  api.get.mockResolvedValue({ data: mockPartners });
      
      // Call the method
      const result = await PartnersService.getPartners();
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/partners', { params: { is_active: true } });
      
      // Verify the result
      expect(result).toEqual(mockPartners);
    });
    
    it('should fetch inactive partners when specified', async () => {
      // Mock data
      const mockPartners = [
        { id: 3, name: 'FormerPartner', is_active: false }
      ];
      
      // Mock API response
  api.get.mockResolvedValue({ data: mockPartners });
      
      // Call the method with is_active = false
      const result = await PartnersService.getPartners(false);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/partners', { params: { is_active: false } });
      
      // Verify the result
      expect(result).toEqual(mockPartners);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Failed to fetch partners');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(PartnersService.getPartners()).rejects.toThrow('Failed to fetch partners');
    });
  });
  
  describe('getPartner', () => {
    it('should fetch a specific partner by id', async () => {
      // Mock data
      const mockPartner = { 
        id: 1, 
        name: 'GreenMart', 
        description: 'Eco-friendly supermarket',
        logo_url: 'https://example.com/greenmart.png',
        website: 'https://greenmart.example.com',
        is_active: true
      };
      
      // Mock API response
  api.get.mockResolvedValue({ data: mockPartner });
      
      // Call the method
      const result = await PartnersService.getPartner(1);
      
      // Verify the API was called correctly
      expect(api.get).toHaveBeenCalledWith('/partners/1');
      
      // Verify the result
      expect(result).toEqual(mockPartner);
    });
    
    it('should throw error when API call fails', async () => {
      // Mock API error
      const error = new Error('Partner not found');
      api.get.mockRejectedValueOnce(error);
      
      // Verify error is thrown
      await expect(PartnersService.getPartner(999)).rejects.toThrow('Partner not found');
    });
  });
});