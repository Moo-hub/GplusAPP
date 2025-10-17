import React from 'react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
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
    useLocation: () => ({ 
      state: { from: { pathname: '/dashboard' } } 
    })
  };
});

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    // Set up mocks
    useAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false
    });
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the login form', () => {
    render(<Login />);
    
    // Check that the form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|login/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<Login />);
    
    // Try to submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    
    // Check that validation messages appear
    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
    });
    
    // Login function should not be called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Setup
    mockLogin.mockResolvedValueOnce();
    render(<Login />);
    
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
    
    render(<Login />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
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
    // Setup with a previous location
    const mockNavigate = vi.fn();
    vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    vi.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ 
      state: { from: { pathname: '/profile' } } 
    });
    
    mockLogin.mockResolvedValueOnce();
    
    render(<Login />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in|login/i }));
    
    // Verify navigation after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });
});