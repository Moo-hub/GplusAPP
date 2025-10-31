import React from "react";
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { server } from '../../mocks/server';
import * as api from '../../services/api';
import { customRender } from '../../test-utils';
import PaymentScreen from '../screens/PaymentScreen';

describe('PaymentScreen Integration', () => {
  it('fetches and displays payment methods from API', async () => {
    // Mock getPaymentMethods to return payment methods
    const spy = vi.spyOn(api, 'getPaymentMethods').mockResolvedValue({ methods: ['Visa', 'PayPal'] });
    customRender(<PaymentScreen />);
    expect(await screen.findByText(/Visa/i)).toBeInTheDocument();
    expect(await screen.findByText(/PayPal/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('handles API error gracefully', async () => {
    // Mock getPaymentMethods to throw an error
    const spy = vi.spyOn(api, 'getPaymentMethods').mockRejectedValue(new Error('Server error'));
    customRender(<PaymentScreen />);
    // Assert on the standardized error container test id
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
    spy.mockRestore();
  });

  it('handles empty payment methods', async () => {
    // Mock getPaymentMethods to return empty array
    const spy = vi.spyOn(api, 'getPaymentMethods').mockResolvedValue({ methods: [] });
    customRender(<PaymentScreen />);
    expect(await screen.findByTestId('empty')).toBeInTheDocument();
    spy.mockRestore();
  });
});

