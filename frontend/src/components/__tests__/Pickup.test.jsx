import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../../i18n';
import Pickup from '../Pickup';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';

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
  // Check native disabled property
  expect(btn.hasAttribute('disabled')).toBe(true);
  // Wait for any toast DOM node added by the toast implementation (role=alert)
  const toasts = await screen.findAllByRole('alert', {}, { timeout: 2000 });
  expect(toasts.length).toBeGreaterThan(0);
  });
});


