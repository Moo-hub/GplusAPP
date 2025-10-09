import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import i18next from 'i18next';
import i18n from './i18n';
import { BrowserRouter } from 'react-router-dom';

/**
 * قالب اختبار للشاشات المبنية على GenericScreen مع دعم i18n
 * @param {React.Component} Component - مكون الشاشة (مثل PaymentScreen)
 * @param {Object} options - إعدادات الاختبار
 * @param {string} options.loadingTestId - data-testid لحالة التحميل
 * @param {string} options.successKey - مفتاح الترجمة لحالة النجاح
 * @param {string} options.emptyKey - مفتاح الترجمة لحالة عدم وجود بيانات
 * @param {string} options.errorKey - مفتاح الترجمة لحالة الخطأ
 */
export function runGenericScreenTests(Component, {
  loadingTestId = 'loading-skeleton',
  successKey,
  emptyKey,
  errorKey,
}) {
  describe(`${Component.name} tests`, () => {
    it('renders loading state', () => {
      render(<Component />);
      expect(screen.getByTestId(loadingTestId)).toBeInTheDocument();
    });

    if (successKey) {
      it('renders success state', async () => {
        render(<Component />);
        const translated = i18next.t(successKey);
        const item = await screen.findByText(new RegExp(translated, 'i'));
        expect(item).toBeInTheDocument();
      });
    }

    if (emptyKey) {
      it('renders empty state', async () => {
        render(<Component />);
        const translated = i18next.t(emptyKey);
        const item = await screen.findByText(new RegExp(translated, 'i'));
        expect(item).toBeInTheDocument();
      });
    }

    if (errorKey) {
      it('renders error state', async () => {
        render(<Component />);
        const translated = i18next.t(errorKey);
        const item = await screen.findByText(new RegExp(translated, 'i'));
        expect(item).toBeInTheDocument();
      });
    }
  });
}

// يمكنك إضافة مزودات أخرى هنا حسب حاجتك
export function customRender(ui, options) {
  return render(
    <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>,
    options
  );
}

// الترجمة الخاصة بطرق الدفع
i18next.addResources('en', 'payment', {
  "methods": {
    "creditCard": "Credit Card",
    "empty": "No payment methods available",
    "error": "Failed to load payment methods"
  }
});

// الترجمة الخاصة بالمركبات
i18next.addResources('en', 'vehicles', {
  "title": "Vehicles",
  "empty": "No vehicles found",
  "error": "Failed to load vehicles",
  "truckA": "Truck A",
  "truckB": "Truck B"
});

// الترجمة الخاصة بالنقاط
i18next.addResources('en', 'points', {
  "title": "My G+ Points",
  "total": "Total",
  "rewards": "Rewards",
  "empty": "No rewards found",
  "error": "Failed to load points"
});

// الترجمة الخاصة بالشركات
i18next.addResources('en', 'companies', {
  "title": "Companies",
  "empty": "No companies found",
  "error": "Failed to load companies",
  "ecoCorp": "EcoCorp",
  "greenTech": "GreenTech"
});

/**
 * Standard mocks for i18next used in most components
 */
export const mockTranslations = {
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
  'common.backToHome': 'Back to Home'
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
        const translation = translations[key];
        if (typeof translation === 'function') {
          return translation(options);
        }
        return translation || key;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn()
      }
    })
  };
};

/**
 * Helper to render components with router context
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional options
 * @returns Rendered component with Testing Library utilities
 */
export const renderWithRouter = (ui, options = {}) => {
  return render(ui, {
    wrapper: BrowserRouter,
    ...options,
  });
};

/**
 * Mock the auth context for testing authenticated components
 * @param {Object} user - User object to use in tests
 * @returns Mock configuration for auth context
 */
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

/**
 * Create a mock date for testing
 * @param {string|number} mockDate - Date to use for mock
 * @returns Original Date object for restoration
 */
export const mockDate = (mockDateString) => {
  const originalDate = global.Date;
  const mockDate = new Date(mockDateString);
  
  class MockDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        return new originalDate(mockDate);
      }
      return new originalDate(...args);
    }
    
    static now() {
      return mockDate.getTime();
    }
  }
  
  global.Date = MockDate;
  
  return originalDate;
};

/**
 * Restore original Date after tests
 * @param {Date} originalDate - Original Date object
 */
export const restoreDate = (originalDate) => {
  global.Date = originalDate;
};