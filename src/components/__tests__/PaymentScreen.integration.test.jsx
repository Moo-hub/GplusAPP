import { screen, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { customRender } from '../../test-utils';

describe('PaymentScreen Integration', () => {
  it('fetches and displays payment methods from API', async () => {
    customRender(<PaymentScreen />);
    expect(await screen.findByText(/Visa/i)).toBeInTheDocument();
    expect(await screen.findByText(/PayPal/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    server.use(
      http.get('/api/payments/methods', () => HttpResponse.json(null, { status: 500 }))
    );
    customRender(<PaymentScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

