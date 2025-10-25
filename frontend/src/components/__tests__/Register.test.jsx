import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import renderWithProviders, { makeAuthMocks } from '../../../../tests/test-utils.jsx';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from '../Register';


describe('Register Component', () => {
  const mockRegister = vi.fn();
  let auth;

  beforeEach(() => {
    vi.clearAllMocks();
    auth = makeAuthMocks({ register: mockRegister });
  });

  it('renders the registration form correctly', () => {
    renderWithProviders(<Register />, { route: '/register', auth });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    renderWithProviders(<Register />, { route: '/register', auth });
    const registerButton = screen.getByRole('button', { name: /register/i });
    const user = userEvent.setup();
    await user.click(registerButton);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error if passwords do not match', async () => {
    renderWithProviders(<Register />, { route: '/register', auth });
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    const user = userEvent.setup();
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password321');
    await user.click(registerButton);
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register function with correct data and navigates on success', async () => {
    mockRegister.mockResolvedValueOnce();
    renderWithProviders(
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </Routes>,
      { route: '/register', auth }
    );
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    const user = userEvent.setup();
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(registerButton);
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }));
    await screen.findByTestId('dashboard-page');
  });

  it('shows error message on registration failure', async () => {
    const mockError = new Error('Registration failed');
    Object.assign(mockError, { response: { data: { message: 'Registration failed' } } });
    mockRegister.mockRejectedValueOnce(mockError);
    renderWithProviders(<Register />, { route: '/register', auth });
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    const user = userEvent.setup();
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(registerButton);
    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
  });

  it('disables the register button and shows loading state during submission', async () => {
    mockRegister.mockImplementationOnce(() => new Promise(() => {}));
    renderWithProviders(<Register />, { route: '/register', auth });
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const registerButton = screen.getByRole('button', { name: /register/i });
    const user = userEvent.setup();
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(registerButton);
    await waitFor(() => expect(registerButton).toBeDisabled());
    expect(registerButton).toHaveTextContent(/loading/i);
  });
});
