import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompanyService from '../../src/services/company';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

// Import the mocked API
import api from '../../src/services/api';

describe('CompanyService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  describe('getAllCompanies', () => {
    it('should fetch all companies', async () => {
      // Setup
      const mockCompanies = [
        { id: 1, name: 'Green Recycling Inc.', address: '123 Green St' },
        { id: 2, name: 'Eco Waste Solutions', address: '456 Eco Ave' }
      ];
      api.get.mockResolvedValue({ data: mockCompanies });

      // Execute
      const result = await CompanyService.getAllCompanies();

      // Verify
      expect(api.get).toHaveBeenCalledWith('/companies');
      expect(result).toEqual(mockCompanies);
    });

    it('should propagate errors', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Network error'));

      // Execute & Verify
      await expect(CompanyService.getAllCompanies()).rejects.toThrow('Network error');
    });
  });

  describe('getCompanyById', () => {
    it('should fetch a company by ID', async () => {
      // Setup
      const mockCompany = {
        id: 1,
        name: 'Green Recycling Inc.',
        address: '123 Green St',
        contactEmail: 'contact@greenrecycling.com',
        phone: '555-123-4567'
      };
      api.get.mockResolvedValue({ data: mockCompany });

      // Execute
      const result = await CompanyService.getCompanyById(1);

      // Verify
      expect(api.get).toHaveBeenCalledWith('/companies/1');
      expect(result).toEqual(mockCompany);
    });

    it('should propagate errors when company not found', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Company not found'));

      // Execute & Verify
      await expect(CompanyService.getCompanyById(999)).rejects.toThrow('Company not found');
    });
  });
});