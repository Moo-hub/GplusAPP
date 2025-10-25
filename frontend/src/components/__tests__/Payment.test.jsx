// import React from 'react'; // Remove duplicate React import
import { render, screen } from '@testing-library/react';
import Payment from '../Payment';
import { setupI18nMock } from '../../test-utils';

// Mock the payments API so the component receives deterministic methods
vi.mock('../../api/payments', () => ({
  getPaymentMethods: vi.fn(() => Promise.resolve(['credit_card', 'wallet', 'bank_transfer'])),
}));

describe('Payment', () => {
  it('renders payment methods', async () => {
    const { useTranslation } = setupI18nMock({ payment: 'Payment', credit_card: 'Credit Card', wallet: 'Wallet', bank_transfer: 'Bank Transfer' });
    vi.mock('react-i18next', () => ({ useTranslation: () => useTranslation() }));
    render(<Payment />);
    expect(await screen.findByText(/Payment|payment/i)).toBeInTheDocument();
    expect(await screen.findByText(/credit[_\s]?card|Credit Card|credit_card/i)).toBeInTheDocument();
    expect(await screen.findByText(/wallet|Wallet|wallet/i)).toBeInTheDocument();
  });
});


