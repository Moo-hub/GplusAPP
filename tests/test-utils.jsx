import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OfflineContext from '../src/contexts/OfflineContext';

// Lightweight i18n mock used consistently across tests
export const i18nMock = {
  t: (key, opts) => (typeof key === 'string' ? key : ''),
  language: 'en'
};

// Default QueryClient for test runs (no retries)
const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

// Simple Auth mock provider used in many tests. Tests can pass `authOverrides`
// to customize the mocked hook implementation.
export const AuthContextMock = ({ children, authOverrides = {} }) => {
  const defaultAuth = {
    login: jestOrViMock(),
    register: jestOrViMock(),
    logout: jestOrViMock(),
    isAuthenticated: () => false,
    currentUser: null,
    userRole: null
  };
  const provided = { ...defaultAuth, ...authOverrides };

  // Inject the test auth object onto globalThis so our real `useAuth` will
  // pick it up during tests. This avoids needing to import the real
  // AuthContext provider inside the test utils and avoids module mocking
  // order issues.
  globalThis.__TEST_AUTH = provided;

  return <div data-testid="auth-mock-provider">{children}</div>;
};

// Lightweight test OfflineProvider wrapper.
// We import the real OfflineProvider but avoid its initialization side-effects
// in tests by shallow-wrapping children with a stable value when possible.
// If the real provider runs costly effects, consider exporting a test-only
// stub from the app or mocking its module in tests instead.
export const TestOfflineProvider = ({ children, value = null }) => {
  const defaultValue = value || {
    isOnline: true,
    isAppOffline: false,
    pendingRequests: [],
    offlineMode: false,
    toggleOfflineMode: () => {},
    queueRequest: async () => ({ success: true }),
    syncPendingRequests: async () => {}
  };

  return (
    <OfflineContext.Provider value={defaultValue}>
      {children}
    </OfflineContext.Provider>
  );
};

// Expose a helper so tests can quickly create consistent mock functions
export const makeAuthMocks = (overrides = {}) => ({
  login: jestOrViMock(),
  register: jestOrViMock(),
  logout: jestOrViMock(),
  isAuthenticated: () => false,
  currentUser: null,
  userRole: null,
  ...overrides
});

// Helper to use either jest.fn or vi.fn depending on test runtime. Vitest exposes
// `global.vi` in tests; if not present fall back to a no-op function generator.
function jestOrViMock() {
  if (typeof globalThis.vi === 'function') return globalThis.vi.fn();
  if (typeof globalThis.jest === 'object' && typeof globalThis.jest.fn === 'function') return globalThis.jest.fn();
  return () => {};
}

export function renderWithProviders(ui, { route = '/', queryClient = createTestQueryClient(), auth = {} } = {}) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <AuthContextMock authOverrides={auth}>
          <TestOfflineProvider>{children}</TestOfflineProvider>
        </AuthContextMock>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper });
}

export default renderWithProviders;
