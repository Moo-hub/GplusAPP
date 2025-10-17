import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCompanies } from '../src/hooks/useCompanies';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import CompanyList from '../src/components/CompanyList';
import { MemoryRouter } from 'react-router-dom';

// Mock the useCompanies hook
vi.mock('../src/hooks/useCompanies', () => ({
  useCompanies: vi.fn()
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('CompanyList Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    useCompanies.mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
      isFetching: false,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CompanyList />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useCompanies.mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new Error('Failed to load'),
      isFetching: false,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CompanyList />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('errors.dataLoadingError')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders companies when data is available', () => {
    const mockCompanies = [
      { id: 1, name: 'Company A', type: 'recycling', location: 'New York' },
      { id: 2, name: 'Company B', type: 'producer', location: 'San Francisco' }
    ];

    useCompanies.mockReturnValue({
      isLoading: false,
      data: mockCompanies,
      error: null,
      isFetching: false,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CompanyList />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('companies.title')).toBeInTheDocument();
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
  });

  it('renders no companies message when data is empty', () => {
    useCompanies.mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
      isFetching: false,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CompanyList />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('companies.noCompanies')).toBeInTheDocument();
  });
});