import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

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