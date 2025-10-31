import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import i18n from '../../i18n';
import Pickup from './Pickup';

describe('Pickup', () => {
  it('renders pickup screen and handles request', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
        <ToastContainer />
      </I18nextProvider>
    );
    expect(screen.getByText(/Request Pickup/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Request Now/i });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    // Wait for toast
    const toast = await screen.findByText(/Request Pickup Request Now/i, {}, { timeout: 2000 });
    expect(toast).toBeInTheDocument();
  });
});


