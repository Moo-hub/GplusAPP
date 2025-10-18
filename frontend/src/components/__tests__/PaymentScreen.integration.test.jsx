import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { server } from '../../mocks/server';
import * as api from '../../services/api';
import { customRender } from '../../test-utils';
import PaymentScreen from '../screens/PaymentScreen';

describe('PaymentScreen Integration', () => {
  it('fetches and displays payment methods from API', async () => {
    customRender(<PaymentScreen />);
    expect(await screen.findByText(/Visa/i)).toBeInTheDocument();
    expect(await screen.findByText(/PayPal/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Spy on the service-level function to force an error path. This is
    // more robust across msw copies and avoids absolute-URL mismatches.
  const spy = vi.spyOn(api, 'getPaymentMethods').mockRejectedValueOnce({ message: 'Server error', status: 500 });
    customRender(<PaymentScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    spy.mockRestore();
  });
});

