import { render, screen } from '@testing-library/react';
import i18n from '../../i18n';

describe('Payment', () => {
  it('renders payment methods', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Payment />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Payment/i)).toBeInTheDocument();
    expect(await screen.findByText(/Credit Card/i)).toBeInTheDocument();
    expect(await screen.findByText(/Wallet/i)).toBeInTheDocument();
  });
});


