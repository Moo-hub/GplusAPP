import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { CSRFProvider } from '../contexts/CSRFContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n'; // Import your i18n configuration

// Create a custom render method that includes providers
const customRender = (
  ui,
  {
    route = '/',
    initialEntries = [route],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        },
      },
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <OfflineProvider>
              <CSRFProvider>
                <MemoryRouter initialEntries={initialEntries}>
                  {children}
                </MemoryRouter>
              </CSRFProvider>
            </OfflineProvider>
          </AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  };
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Create a function to render components with routes
const renderWithRoutes = (
  routes,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        },
      },
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <OfflineProvider>
              <CSRFProvider>
                <MemoryRouter initialEntries={initialEntries}>
                  <Routes>
                    {routes}
                  </Routes>
                </MemoryRouter>
              </CSRFProvider>
            </OfflineProvider>
          </AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  };
  return render(<Wrapper />, renderOptions);
};

// Mock the auth context for testing
const createMockAuthContext = (overrides = {}) => {
  return {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
};

// Mock the offline context for testing
const createMockOfflineContext = (overrides = {}) => {
  return {
    isOffline: false,
    isCheckingConnection: false,
    queuedRequests: [],
    queueRequest: vi.fn(),
    processQueue: vi.fn(),
    ...overrides
  };
};

// Function to wait for async operations
const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Export everything from RTL and our custom helpers
export * from '@testing-library/react';
export { 
  customRender as render,
  renderWithRoutes,
  createMockAuthContext,
  createMockOfflineContext,
  waitForAsync
};