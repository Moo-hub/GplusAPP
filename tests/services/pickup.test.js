import { describe, it, expect, vi, beforeEach } from 'vitest';
import PickupService from '../../src/services/pickup';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Import the mocked API
import api from '../../src/services/api';

describe('PickupService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  describe('getAllPickups', () => {
    it('should fetch all pickups', async () => {
      // Setup
      const mockPickups = [
        { id: 1, address: '123 Main St', status: 'pending' },
        { id: 2, address: '456 Elm St', status: 'completed' }
      ];
      api.get.mockResolvedValue({ data: mockPickups });

      // Execute
      const result = await PickupService.getAllPickups();

      // Verify
      expect(api.get).toHaveBeenCalledWith('/pickup');
      expect(result).toEqual(mockPickups);
    });

    it('should propagate errors', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Network error'));

      // Execute & Verify
      await expect(PickupService.getAllPickups()).rejects.toThrow('Network error');
    });
  });

  describe('getPickupById', () => {
    it('should fetch a pickup by ID', async () => {
      // Setup
      const mockPickup = { id: 1, address: '123 Main St', status: 'pending' };
      api.get.mockResolvedValue({ data: mockPickup });

      // Execute
      const result = await PickupService.getPickupById(1);

      // Verify
      expect(api.get).toHaveBeenCalledWith('/pickup/1');
      expect(result).toEqual(mockPickup);
    });

    it('should propagate errors', async () => {
      // Setup
      api.get.mockRejectedValue(new Error('Not found'));

      // Execute & Verify
      await expect(PickupService.getPickupById(999)).rejects.toThrow('Not found');
    });
  });

  describe('createPickup', () => {
    it('should create a new pickup', async () => {
      // Setup
      const pickupData = { 
        address: '789 Oak St', 
        date: '2023-06-01',
        items: ['plastic', 'paper']
      };
      const mockResponse = { 
        id: 3, 
        ...pickupData, 
        status: 'pending',
        createdAt: '2023-05-20T12:00:00Z'
      };
      api.post.mockResolvedValue({ data: mockResponse });

      // Execute
      const result = await PickupService.createPickup(pickupData);

      // Verify
      expect(api.post).toHaveBeenCalledWith('/pickup', pickupData);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors', async () => {
      // Setup
      const invalidData = { address: '' };
      api.post.mockRejectedValue(new Error('Validation error'));

      // Execute & Verify
      await expect(PickupService.createPickup(invalidData)).rejects.toThrow('Validation error');
    });
  });

  describe('updatePickup', () => {
    it('should update an existing pickup', async () => {
      // Setup
      const pickupId = 2;
      const updateData = { status: 'in_progress' };
      const mockResponse = { 
        id: pickupId, 
        address: '456 Elm St',
        date: '2023-06-15',
        status: 'in_progress',
        updatedAt: '2023-05-21T09:30:00Z'
      };
      api.put.mockResolvedValue({ data: mockResponse });

      // Execute
      const result = await PickupService.updatePickup(pickupId, updateData);

      // Verify
      expect(api.put).toHaveBeenCalledWith(`/pickup/${pickupId}`, updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors', async () => {
      // Setup
      api.put.mockRejectedValue(new Error('Not found'));

      // Execute & Verify
      await expect(PickupService.updatePickup(999, { status: 'cancelled' }))
        .rejects.toThrow('Not found');
    });
  });

  describe('cancelPickup', () => {
    it('should cancel a pickup', async () => {
      // Setup
      const pickupId = 3;
      api.delete.mockResolvedValue({});

      // Execute
      await PickupService.cancelPickup(pickupId);

      // Verify
      expect(api.delete).toHaveBeenCalledWith(`/pickup/${pickupId}`);
    });

    it('should propagate errors', async () => {
      // Setup
      api.delete.mockRejectedValue(new Error('Permission denied'));

      // Execute & Verify
      await expect(PickupService.cancelPickup(1)).rejects.toThrow('Permission denied');
    });
  });
});