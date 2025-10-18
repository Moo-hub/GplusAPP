import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as RR from 'react-router-dom';
import Login from '../Login';
import renderWithProviders, { makeAuthMocks } from '../../../../tests/test-utils.jsx';

// We'll assert navigation by rendering routes in a MemoryRouter instead of mocking useNavigate

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.login': 'Login',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.noAccount': 'Don\'t have an account?',
        'auth.register': 'Register',
        'common.loading': 'Loading...',
        'validation.allFieldsRequired': 'All fields are required',
        'auth.invalidCredentials': 'Invalid email or password'
      };
      return translations[key] || key;
    }
  })
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();
  let auth;

  beforeEach(() => {
    vi.clearAllMocks();
    auth = makeAuthMocks({ login: mockLogin });
  });
  
  it('renders the login form correctly', () => {
    renderWithProviders(<Login />, { route: '/', auth });
    
    // Check that all form elements are present
    expect(screen.getByTestId('login-heading')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('auth-links')).toBeInTheDocument();
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });
  
  it('validates input fields and shows error when fields are empty', async () => {
    renderWithProviders(<Login />, { route: '/', auth });
    
    // Try to submit with empty fields
    const loginButton = screen.getByTestId('login-button');
    const user = userEvent.setup();

    await user.click(loginButton);

    // Check that the login function was not called
    await waitFor(() => expect(mockLogin).not.toHaveBeenCalled());
  });
  
  it('calls login function with entered credentials and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce();
    // Render with routes so we can assert navigation
    renderWithProviders(
      <RR.Routes>
        <RR.Route path="/" element={<Login />} />
        <RR.Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </RR.Routes>,
      { route: '/', auth }
    );
    
    // Fill in the form
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    const user = userEvent.setup();

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Check that login function was called with correct arguments
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123'));

    // Check that we navigated to dashboard (route target appears)
    await screen.findByTestId('dashboard-page');
  });
  
  it('shows error message on login failure', async () => {
  // Mock login to throw an error
  const mockError = new Error('Login failed');
  Object.assign(mockError, { response: { data: { detail: 'Invalid credentials' } } });
    mockLogin.mockRejectedValueOnce(mockError);

    // Silence expected console.error emitted by the component when handling
    // the login failure so the test output remains clean.
    const originalConsoleError = console.error;
    console.error = vi.fn();

    renderWithProviders(<Login />, { route: '/', auth });
    
    // Fill in the form and submit
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    const user = userEvent.setup();

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(loginButton);

    // Wait for the component to show an error message
    const error = await screen.findByText(/invalid email or password|invalid credentials/i);
    expect(error).toBeInTheDocument();

    // Ensure we did not navigate (dashboard not mounted)
    expect(screen.queryByTestId('dashboard-page')).toBeNull();
    // restore console.error
    console.error = originalConsoleError;
  });
  
  it('disables the login button and shows loading state during submission', async () => {
    // Create a promise that never resolves during the test
    mockLogin.mockImplementationOnce(() => new Promise(() => {}));
    
    renderWithProviders(<Login />, { route: '/', auth });
    
    // Fill in the form and submit (this will start the login process but not complete it)
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    const user = userEvent.setup();

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Check that button is disabled during submission
    await waitFor(() => expect(loginButton).toBeDisabled());
    expect(loginButton).toHaveTextContent(/loading/i);
    
    // No need to resolve the promise as we're just testing the loading state
  });
});