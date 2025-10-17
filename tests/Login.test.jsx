import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryProvider } from '../src/providers/QueryProvider';
import { ToastProvider } from '../src/components/toast/Toast';
import Login from '../src/components/Login';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock the auth context
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    isAuthenticated: vi.fn(() => false)
  })),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

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
    render(
      <MemoryRouter>
        <QueryProvider>
          <ToastProvider>
            <Login />
          </ToastProvider>
        </QueryProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('auth.login')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.login' })).toBeInTheDocument();
  });

  it('disables the form submission button while submitting', async () => {
    const mockLogin = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

    vi.mocked(useAuth).mockImplementation(() => ({
      login: mockLogin,
      isAuthenticated: vi.fn(() => false)
    }));

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QueryProvider>
          <ToastProvider>
            <Login />
          </ToastProvider>
        </QueryProvider>
      </MemoryRouter>
    );

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