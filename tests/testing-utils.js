/**
 * Testing utilities for the G+ Recycling App
 * 
 * This file contains common utilities and helper functions for testing
 * components and functionality in the application.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../src/components/toast/Toast';
import { AuthProvider } from '../src/contexts/AuthContext';
import { OfflineProvider } from '../src/contexts/OfflineContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';

/**
 * Custom render function that wraps components with all required providers
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options for render
 * @returns {Object} The render result
 */
export function renderWithProviders(ui, options = {}) {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  // Setup auth mock values
  const authValues = {
    currentUser: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    ...options.authValues,
  };

  // Setup offline mock values
  const offlineValues = {
    isOnline: true,
    isAppOffline: false,
    pendingRequests: [],
    addPendingRequest: vi.fn(),
    syncPendingRequests: vi.fn(),
    isDBInitialized: true,
    ...options.offlineValues,
  };

  const AllProviders = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={authValues}>
          <ToastProvider>
            <OfflineProvider value={offlineValues}>
              <BrowserRouter>{children}</BrowserRouter>
            </OfflineProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Mock translations for testing
 */
export const mockTranslations = {
  // Common translations
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.offlineMode': 'Offline Mode',
  
  // Auth related
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.logout': 'Logout',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.forgotPassword': 'Forgot password?',
  
  // Navigation
  'nav.home': 'Home',
  'nav.companies': 'Companies',
  'nav.pickups': 'Pickups',
  'nav.rewards': 'Rewards',
  'nav.myRedemptions': 'My Redemptions',
  'nav.hello': (options) => options ? `Hello, ${options.name}` : 'Hello',
  'nav.logout': 'Logout',
  'nav.login': 'Login',
  'nav.register': 'Register',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  
  // Footer
  'footer.recycling': 'Recycling',
  'footer.terms': 'Terms of Service',
  'footer.privacy': 'Privacy Policy',
  'footer.contact': 'Contact Us',
  
  // Errors
  'errors.pageNotFound': 'Page not found',
  
  // Common
  'common.backToHome': 'Back to Home',
  
  // Offline specific
  'offline.status': 'You are currently offline. Some features may be limited.',
  'offline.pendingRequests': (count) => 
    count === 1 
      ? '1 request waiting to sync' 
      : `${count} requests waiting to sync`,
  'offline.syncNow': 'Sync Now'
};

/**
 * Helper to setup i18next mocks
 * @returns Mock configuration for i18next
 */
export const setupI18nMock = (additionalTranslations = {}) => {
  const translations = { ...mockTranslations, ...additionalTranslations };
  
  return {
    useTranslation: () => ({
      t: (key, options) => {
        if (translations[key] && typeof translations[key] === 'function') {
          return translations[key](options);
        }
        return translations[key] || key;
      },
      i18n: {
        changeLanguage: vi.fn(),
        language: 'en'
      }
    }),
    Trans: ({ i18nKey, components }) => translations[i18nKey] || i18nKey
  };
};

/**
 * Helper to mock the OfflineContext
 * @param {Object} overrides - Values to override in the mock
 * @returns {Object} Mock implementation for OfflineContext
 */
export const mockOfflineContext = (overrides = {}) => ({
  useOffline: () => ({
    isOnline: true,
    isAppOffline: false,
    pendingRequests: [],
    addPendingRequest: vi.fn(),
    syncPendingRequests: vi.fn(),
    isDBInitialized: true,
    ...overrides
  }),
  OfflineProvider: ({ children }) => <>{children}</>
});