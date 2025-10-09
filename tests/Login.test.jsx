import React from 'react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../src/components/Login';
import renderWithProviders, { makeAuthMocks } from './test-utils.jsx';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the login form', () => {
    renderWithProviders(<Login />);

    // Use role-based queries to avoid matching multiple nodes with the same text
    expect(screen.getByRole('heading', { name: 'auth.login' })).toBeInTheDocument();
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('disables the form submission button while submitting', async () => {
    const mockLogin = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const auth = makeAuthMocks({ login: mockLogin, isAuthenticated: () => false });

    const user = userEvent.setup();

  renderWithProviders(<Login />, { auth });

    const emailInput = screen.getByLabelText('auth.email');
    const passwordInput = screen.getByLabelText('auth.password');
    const submitButton = screen.getByRole('button', { name: 'auth.login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});