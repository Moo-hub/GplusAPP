import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Payment from '../../components/Payment';

// Adding missing React import
describe('Payment', () => {
  it('renders payment methods', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Payment />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Payment|payment/i)).toBeInTheDocument();
    expect(await screen.findByText(/Credit Card|credit_card/i)).toBeInTheDocument();
    expect(await screen.findByText(/Wallet|wallet/i)).toBeInTheDocument();
  });
});


