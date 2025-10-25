/* global beforeEach, afterEach, describe, it, test, expect, vi */
// Test utilities for frontend unit tests. Keep defensive guards in place
// to support multiple test runner shapes (CJS/ESM). Removed file-level
// `// @ts-nocheck` to encourage targeted fixes instead of hiding issues.

import React from 'react';
import * as rtl from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Universal i18n mock for all tests
export const setupI18nMock = () => {
  const translations = {
    'dashboard.redisMemoryUsage': 'Redis Memory Usage',
    'dashboard.usedMemory': 'Used Memory',
    'dashboard.totalMemory': 'Total Memory',
    'dashboard.fragmentationRatio': 'Fragmentation Ratio',
    'dashboard.connectedClients': 'Connected Clients',
    'dashboard.stable': 'Stable',
    'dashboard.atRate': 'at Rate',
    'auth.welcome': 'Welcome',
    'auth.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    'nav.points': 'Points',
    'nav.pickups': 'Pickups',
    'nav.companies': 'Companies',
    'nav.profile': 'Profile',
    'nav.performance': 'Performance',
    'dashboard.systemHealth': 'System Health',
    'dashboard.latency': 'Latency',
    'dashboard.connections': 'Connections',
    'dashboard.redisKeyUsage': 'Redis Key Usage',
    'dashboard.totalKeyPatterns': 'Total Key Patterns',
    'dashboard.totalMemoryUsed': 'Total Memory Used',
    'Payment': 'Payment',
    'Credit Card': 'Credit Card',
    'Wallet': 'Wallet',
    'Pickup Schedule': 'Pickup Schedule',
    'Upcoming Requests': 'Upcoming Requests',
    'Past Requests': 'Past Requests',
    'Vehicles': 'Vehicles',
    'loading': 'loading',
    'error': 'error',
    'empty': 'empty',
    'validation.materialsRequired': 'Materials required',
    'validation.dateRequired': 'Date required',
    'validation.addressRequired': 'Address required',
    // Add more keys as needed
  };
  return {
    useTranslation: () => ({
      t: (key) => translations[key] || key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn()
      }
    })
  };
};
const { render: rtlRender, screen, fireEvent, waitFor } = rtl;


// يمكنك إضافة مزودات أخرى هنا حسب حاجتك
export function runGenericScreenTests(ComponentOrElement, options = {}) {
  // ...implementation (already present in file, just needs export)
}

export function customRender(ui, options) {
  const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;
  return rtlRender(<Wrapper>{ui}</Wrapper>, options);
}

export const render = customRender;
export { screen, fireEvent, waitFor };

export const mockTranslations = {
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
  'footer.recycling': 'Recycling',
  'footer.terms': 'Terms of Service',
  'footer.privacy': 'Privacy Policy',
  'footer.contact': 'Contact Us',
  'errors.pageNotFound': 'Page not found',
  'common.backToHome': 'Back to Home'
};

// Add additional common keys used across UI tests so tests that assert
// English labels/texts will find them instead of raw i18n keys.
Object.assign(mockTranslations, {
  'pickup.submit': 'Submit',
  'pickup.address': 'Address',
  'pickup.title': 'Request Pickup',
  'pickup.description': 'Schedule a waste pickup easily with one click.',
  'pickup.step1': 'step1',
  'pickupDate': 'Pickup Date',
  'weightEstimate': 'Weight estimate (kg)',
  'materialsRequired': 'Materials required',
  'dateRequired': 'Date required',
  'addressRequired': 'Address required',
  'validation.materialsRequired': 'Materials required',
  'validation.dateRequired': 'Date required',
  'validation.addressRequired': 'Address required',
  'Requesting...': 'Requesting...',
  'requesting': 'Requesting...',
  'newRequest': 'New Request',
  'selectMaterials': 'Select Materials',
  'submit': 'Submit',
  'Cancel': 'Cancel',
  'error': 'Error',
  'Network error': 'Network error',
  'retry': 'Retry',
  'no_points_found': 'No points found',
  'points.title': 'Points',
  'points.empty': 'No points available',
  'points.error': 'Failed to load points',
  'pickup.requestAnother': 'Request Another',
});



export const renderWithRouter = (ui, options = {}) => {
  return render(ui, {
    wrapper: BrowserRouter,
    ...options,
  });
};

export const mockAuthContext = (user = null) => {
  return {
    useAuth: vi.fn(() => ({
      currentUser: user,
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
      error: null
    }))
  };
};
