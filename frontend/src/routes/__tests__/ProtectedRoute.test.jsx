import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock component to test navigation
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

// Test component as children
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state when authentication is loading', () => {
    // Mock loading state
    useAuth.mockReturnValue({ loading: true, isAuthenticated: false });
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );
    
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({ loading: false, isAuthenticated: false });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    );
    
    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('location-display').textContent).toBe('/login');
  });

  it('renders children when user is authenticated', () => {
    // Mock authenticated state
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true });
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to points when accessing non-auth route while authenticated', () => {
    // Mock authenticated state
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true });
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <div data-testid="login-page">Login Page</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/points" element={<div data-testid="points-page">Points Page</div>} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    );
    
    // Should redirect to points
    expect(screen.getByTestId('points-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('location-display').textContent).toBe('/points');
  });
});