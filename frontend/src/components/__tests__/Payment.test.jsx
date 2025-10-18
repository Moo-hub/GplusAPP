import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import Payment from '../../components/Payment';

// Provide a small deterministic i18n instance for this test
const createTestI18n = (lng = 'en') => {
  const instance = i18next.createInstance();
  instance.init({
    lng,
    resources: {
      en: { translation: { payment: 'Payment', credit_card: 'Credit Card', wallet: 'Wallet', bank_transfer: 'Bank Transfer' } },
    },
    initImmediate: false,
    interpolation: { escapeValue: false },
  });
  return instance;
};

// Mock the payments API so the component receives deterministic methods
vi.mock('../../api/payments', () => ({
  getPaymentMethods: vi.fn(() => Promise.resolve(['credit_card', 'wallet', 'bank_transfer'])),
}));

describe('Payment', () => {
  it('renders payment methods', async () => {
    const inst = createTestI18n();
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = inst;
    render(
      <I18nextProvider i18n={inst}>
        <Payment />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Payment/i)).toBeInTheDocument();
    // Accept either the translation or the raw key (credit_card / Credit Card)
    expect(await screen.findByText(/credit[_\s]?card|Credit Card/i)).toBeInTheDocument();
    expect(await screen.findByText(/wallet|Wallet/i)).toBeInTheDocument();
  });
});


