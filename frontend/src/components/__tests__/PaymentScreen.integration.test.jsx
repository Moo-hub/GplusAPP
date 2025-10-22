import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
vi.mock('../../services/api', () => ({ getPaymentMethods: vi.fn() }));
import * as api from '../../services/api';
import { customRender } from '../../test-utils';
import PaymentScreen from '../screens/PaymentScreen';

describe('PaymentScreen Integration', () => {
  it('fetches and displays payment methods from API', async () => {
  api.getPaymentMethods.mockResolvedValueOnce([ 'Visa', 'PayPal' ]);
  customRender(<PaymentScreen />);
  expect(await screen.findByText(/Visa/i)).toBeInTheDocument();
  expect(await screen.findByText(/PayPal/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Spy on the service-level function to force an error path. This is
    // more robust across msw copies and avoids absolute-URL mismatches.
    api.getPaymentMethods.mockRejectedValueOnce(new Error('Server error'));
    customRender(<PaymentScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  api.getPaymentMethods.mockReset();
  });
});

