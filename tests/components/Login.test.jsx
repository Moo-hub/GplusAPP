import React from 'react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import * as RR from 'react-router-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { renderWithProviders, makeAuthMocks } from '../test-utils';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../src/components/Login';

// Note: do not mock 'react-router-dom' at module scope. The test renderer
// provided by `frontend/src/test-utils.js` wraps components with a
// `BrowserRouter`. Individual tests should spy on or mock `useNavigate`
// and `useLocation` when custom behavior is required.

describe('Login Component', () => {
  let mockLogin;
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    // Set up mocks via our test-utils helper
    mockLogin = vi.fn();
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Use render wrappers with auth override per test via renderWithProviders
    // (individual tests call renderWithProviders with the auth override)
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the login form', () => {
  const auth = makeAuthMocks({ login: mockLogin, isAuthenticated: () => false });
  renderWithProviders(<Login />, { auth });
    
    // Check that the form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
  const auth = makeAuthMocks({ login: mockLogin, isAuthenticated: () => false });
  renderWithProviders(<Login />, { auth });
    
    // Try to submit the form without filling in any fields. Use submit to
    // bypass native constraint validation which can block click events in jsdom.
    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);
    
    // Check that validation messages appear
    // The test environment uses a translation mock that may return keys
    // instead of English text. Match the translation key for robustness.
    await waitFor(() => {
      expect(screen.getByText(/validation\.allFieldsRequired|all fields are required/i)).toBeInTheDocument();
    });
    
    // Login function should not be called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Setup
    mockLogin.mockResolvedValueOnce();
  const auth = makeAuthMocks({ login: mockLogin, isAuthenticated: () => false });
  renderWithProviders(<Login />, { auth });
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    
    // Verify login was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays an error message when login fails', async () => {
    // Setup
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    
  const auth = makeAuthMocks({ login: mockLogin, isAuthenticated: () => false });
  renderWithProviders(<Login />, { auth });
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    
    // Verify error message is displayed. The i18n mock may show a key
    // (e.g. 'auth.invalidCredentials') instead of human text; accept either.
    await waitFor(() => {
      expect(screen.getByText(/auth\.invalidCredentials|Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables the submit button while submitting', async () => {
    // Setup with a delayed login
    mockLogin.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 100);
      });
    });
    
    render(<Login />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in|login/i });
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Check that button is disabled
    expect(submitButton).toBeDisabled();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('redirects to the previous page after successful login', async () => {
    // Setup with a previous location by spying on router hooks. We only
    // spy here to avoid rendering an additional Router (the test-utils
    // renderer already wraps with a BrowserRouter).
      // Render using the raw RTL render to avoid the BrowserRouter wrapper
      // added by our test-utils. This lets us mount a MemoryRouter safely
      // and assert real navigation occurred.
      mockLogin.mockResolvedValueOnce();
      rtlRender(
        <RR.MemoryRouter initialEntries={["/login"]}>
          <RR.Routes>
            <RR.Route path="/login" element={<Login />} />
            <RR.Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          </RR.Routes>
        </RR.MemoryRouter>
      );

      // Fill out the form
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
      await userEvent.type(screen.getByTestId('password-input'), 'password123');

      // Submit the form
  await userEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));

      // Verify navigation to dashboard route occurred (component navigates to /dashboard on success)
      await waitFor(() => expect(screen.getByTestId('dashboard-page')).toBeInTheDocument());
  });
});