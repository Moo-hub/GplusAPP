import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.welcome': 'Welcome',
        'auth.logout': 'Logout',
        'nav.dashboard': 'Dashboard',
        'nav.points': 'Points',
        'nav.pickups': 'Pickups',
        'nav.companies': 'Companies',
        'nav.profile': 'Profile',
        'nav.performance': 'Performance'
      };
      return translations[key] || key;
    }
  })
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation for regular users', () => {
    // Mock the user as logged in
    useAuth.mockReturnValue({
      currentUser: { name: 'Test User', is_admin: false },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Check user info
    expect(screen.getByTestId('user-info')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, Test User');
    expect(screen.getByTestId('logout-button')).toHaveTextContent('Logout');

    // Check navigation links for regular user
    expect(screen.getByTestId('side-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('nav-list')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Pickups')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();

    // Check admin links are not visible to regular user
    expect(screen.queryByTestId('admin-nav-item')).not.toBeInTheDocument();
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
  });

  it('renders navigation with admin links for admin users', () => {
    // Mock the user as an admin
    useAuth.mockReturnValue({
      currentUser: { name: 'Admin User', is_admin: true },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Check admin-specific link is visible
    expect(screen.getByTestId('admin-nav-item')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('does not render when user is not logged in', () => {
    // Mock the user as not logged in
    useAuth.mockReturnValue({
      currentUser: null,
      logout: vi.fn()
    });

    const { container } = render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // The component should return null when user is not logged in
    expect(container.firstChild).toBeNull();
  });

  it('calls logout function when logout button is clicked', () => {
    // Mock the logout function
    const mockLogout = vi.fn();
    useAuth.mockReturnValue({
      currentUser: { name: 'Test User', is_admin: false },
      logout: mockLogout
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Click the logout button
    screen.getByTestId('logout-button').click();
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders the correct number of navigation items', () => {
    // Mock the user as logged in
    useAuth.mockReturnValue({
      currentUser: { name: 'Test User', is_admin: false },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Check the number of navigation items (5 for regular users)
    const navItems = screen.getAllByRole('listitem');
    expect(navItems.length).toBe(5);
  });
});