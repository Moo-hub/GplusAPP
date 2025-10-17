import React from 'react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Register from '../components/Register';
import { useAuth } from '../contexts/AuthContext';

// Mock the auth context module
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }) => <a>{children}</a>
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.register': 'Register',
        'auth.name': 'Name',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirmPassword': 'Confirm Password',
        'auth.alreadyHaveAccount': 'Already have an account?',
        'auth.login': 'Log In',
        'auth.registrationFailed': 'Registration failed',
        'validation.nameRequired': 'Name is required',
        'validation.emailRequired': 'Email is required',
        'validation.emailInvalid': 'Email is invalid',
        'validation.passwordRequired': 'Password is required',
        'validation.passwordTooShort': 'Password must be at least 6 characters',
        'validation.passwordsDontMatch': 'Passwords do not match'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the LoadingSpinner component
vi.mock('../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('Register Component', () => {
  const mockRegister = vi.fn();
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    // Set up mocks
    useAuth.mockReturnValue({
      register: mockRegister,
      isAuthenticated: false
    });
    
    vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the registration form', () => {
    render(<Register />);
    
    // Check that the form elements are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<Register />);
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<Register />);
    
    // Fill in invalid email
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Move focus away to trigger validation
    fireEvent.blur(screen.getByLabelText(/email/i));
    
    // Check for email format error
    await waitFor(() => {
      expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(<Register />);
    
    // Fill in short password
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), '12345');
    await userEvent.type(screen.getByLabelText(/confirm password/i), '12345');
    
    // Move focus away to trigger validation
    fireEvent.blur(screen.getByLabelText(/^password$/i));
    
    // Check for password length error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    render(<Register />);
    
    // Fill in non-matching passwords
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password456');
    
    // Move focus away to trigger validation
    fireEvent.blur(screen.getByLabelText(/confirm password/i));
    
    // Check for password match error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Registration function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Setup
    mockRegister.mockResolvedValueOnce();
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify registration was called with correct data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Check navigation to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message when registration fails', async () => {
    // Setup
    const errorMessage = 'Email already registered';
    mockRegister.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });
    
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays loading spinner while submitting', async () => {
    // Setup with a delayed registration
    let resolvePromise;
    mockRegister.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));
    
    render(<Register />);
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check for loading spinner
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
    
    // Complete the registration process
    resolvePromise();
    
    // Check that navigation occurred after registration completed
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});