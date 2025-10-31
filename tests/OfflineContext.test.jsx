import React from 'react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from '../src/contexts/OfflineContext';
import renderWithProviders from './test-utils.jsx';
import { initDB, addPendingRequest, getPendingRequests, markRequestSynced } from '../src/utils/offlineStorage';

// Mock the IndexedDB utilities
vi.mock('../src/utils/offlineStorage', () => ({
  initDB: vi.fn().mockResolvedValue(),
  addPendingRequest: vi.fn().mockResolvedValue(),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  markRequestSynced: vi.fn().mockResolvedValue(),
  deleteSyncedRequests: vi.fn().mockResolvedValue()
}));

// Mock navigator
const mockNavigator = {
  onLine: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Store the original navigator
const originalNavigator = { ...navigator };

describe('OfflineContext', () => {
  // Mock navigator before each test
  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  // Restore navigator after each test
  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  it('should initialize with correct default values', async () => {
    // Mock getPendingRequests to return some requests
    getPendingRequests.mockResolvedValue([
      { id: 1, url: '/api/test', method: 'POST' }
    ]);

  // Render the hook with our test providers wrapper
  const { result } = renderHook(() => useOffline(), { wrapper: ({ children }) => renderWithProviders(children).container });

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(result.current.isDBInitialized).toBe(true);
    });

    // Verify that initDB was called
    expect(initDB).toHaveBeenCalledTimes(1);

    // Verify that the hook returned the correct initial values
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isAppOffline).toBe(false);
    
    // Verify that getPendingRequests was called
    expect(getPendingRequests).toHaveBeenCalledTimes(1);
    
    // Verify that the hook loaded the pending requests
    // Only compare serializable data, not DOM elements
    expect(result.current.pendingRequests).toEqual([
      { id: 1, url: '/api/test', method: 'POST' }
    ]);
  });

  it('should detect when the application goes offline', async () => {
    // Create a wrapper component to provide the context
  const { result } = renderHook(() => useOffline(), { wrapper: ({ children }) => renderWithProviders(children).container });

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(result.current.isDBInitialized).toBe(true);
    });

    // Verify that the initial online status is true
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isAppOffline).toBe(false);

    // Simulate going offline
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });
      // Trigger the offline event
      window.dispatchEvent(new Event('offline'));
    });

    // Verify that the hook detected the offline status
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isAppOffline).toBe(true);
  });

  it('should allow adding pending requests when offline', async () => {
    // Create a wrapper component to provide the context
  const { result } = renderHook(() => useOffline(), { wrapper: ({ children }) => renderWithProviders(children).container });

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(result.current.isDBInitialized).toBe(true);
    });

    // Simulate going offline
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    // Mock getPendingRequests to return updated list after adding
    const newRequest = {
      url: '/api/test',
      method: 'POST',
      data: { test: true },
      headers: { 'Content-Type': 'application/json' }
    };
    
    getPendingRequests.mockResolvedValue([
      { id: 1, ...newRequest }
    ]);

    // Add a pending request
    await act(async () => {
      await result.current.addPendingRequest(newRequest);
    });

    // Verify that addPendingRequest was called with the correct parameters
    expect(addPendingRequest).toHaveBeenCalledWith(newRequest);
    
    // Verify that getPendingRequests was called again to refresh the list
    expect(getPendingRequests).toHaveBeenCalled();
    
    // Verify that the pending requests were updated
    expect(result.current.pendingRequests).toEqual([
      { id: 1, ...newRequest }
    ]);
  });

  it('should synchronize pending requests when coming back online', async () => {
    // Mock the fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Mock getPendingRequests to return some requests
    const pendingRequests = [
      { 
        id: 1, 
        url: '/api/test1', 
        method: 'POST',
        data: { test: 1 },
        headers: { 'Content-Type': 'application/json' }
      },
      { 
        id: 2, 
        url: '/api/test2', 
        method: 'PUT',
        data: { test: 2 },
        headers: { 'Content-Type': 'application/json' }
      }
    ];
    
    getPendingRequests.mockResolvedValue(pendingRequests);

    // Create a wrapper component to provide the context
  const { result } = renderHook(() => useOffline(), { wrapper: ({ children }) => renderWithProviders(children).container });

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(result.current.isDBInitialized).toBe(true);
    });

    // Simulate being offline initially
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    // Verify offline status
    expect(result.current.isOnline).toBe(false);
    expect(result.current.pendingRequests).toEqual(pendingRequests);

    // Mock getPendingRequests to return an empty array after synchronization
    getPendingRequests.mockResolvedValue([]);

    // Simulate coming back online and synchronizing pending requests
    await act(async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
      await result.current.syncPendingRequests();
    });

    // Verify that fetch was called for each pending request
    expect(global.fetch).toHaveBeenCalledTimes(pendingRequests.length);
    
    // Verify that markRequestSynced was called for each request
    expect(markRequestSynced).toHaveBeenCalledTimes(pendingRequests.length);
    
    // Verify that getPendingRequests was called again to refresh the list
    expect(getPendingRequests).toHaveBeenCalled();
    
    // Verify that the pending requests were updated
    expect(result.current.pendingRequests).toEqual([]);
    
    // Clean up mock
    delete global.fetch;
  });
});