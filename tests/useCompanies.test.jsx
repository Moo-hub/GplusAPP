import React from 'react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompanies, useCompany } from '../src/hooks/useCompanies';

// Mock the API service
vi.mock('../src/services/company', () => ({
  default: {
    getCompanies: vi.fn(),
    getCompany: vi.fn()
  }
}));

// Mock the toast component
vi.mock('../src/components/toast/Toast', () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn()
  })
}));

// Create a wrapper component for providing context
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCompanies Hook', () => {
  let CompanyService;
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Use dynamic import so the test file stays ESM-friendly and Vite/Vitest
    // can apply transforms to the imported modules (like .jsx files).
    return import('../src/services/company').then(mod => {
      CompanyService = mod.default;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches companies when called with no filters', async () => {
    const mockCompanies = [
      { id: 1, name: 'Company A' },
      { id: 2, name: 'Company B' }
    ];
    
    CompanyService.getCompanies.mockResolvedValue(mockCompanies);
    
    const { result } = renderHook(() => useCompanies(), {
      wrapper: createWrapper()
    });
    
    // Initially in loading state
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the query to resolve
    await waitFor(() => !result.current.isLoading);
    
    // Check the final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockCompanies);
    expect(CompanyService.getCompanies).toHaveBeenCalledWith({});
  });

  it('fetches companies with filters', async () => {
    const mockCompanies = [{ id: 1, name: 'Company A' }];
    const filters = { type: 'recycling' };
    
    CompanyService.getCompanies.mockResolvedValue(mockCompanies);
    
    const { result } = renderHook(() => useCompanies(filters), {
      wrapper: createWrapper()
    });
    
    // Wait for the query to resolve
    await waitFor(() => !result.current.isLoading);
    
    // Check the final state
    expect(result.current.data).toEqual(mockCompanies);
    expect(CompanyService.getCompanies).toHaveBeenCalledWith(filters);
  });
});

describe('useCompany Hook', () => {
  let CompanyService;
  
  beforeEach(() => {
    return import('../src/services/company').then(mod => {
      CompanyService = mod.default;
      vi.resetAllMocks();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a specific company by id', async () => {
    const mockCompany = { id: 1, name: 'Company A' };
    
    CompanyService.getCompany.mockResolvedValue(mockCompany);
    
    const { result } = renderHook(() => useCompany(1), {
      wrapper: createWrapper()
    });
    
    // Initially in loading state
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the query to resolve
    await waitFor(() => !result.current.isLoading);
    
    // Check the final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockCompany);
    expect(CompanyService.getCompany).toHaveBeenCalledWith(1);
  });

  it('does not fetch if no id is provided', async () => {
    const { result } = renderHook(() => useCompany(null), {
      wrapper: createWrapper()
    });
    
    // Should not be loading because the query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(CompanyService.getCompany).not.toHaveBeenCalled();
  });
});
