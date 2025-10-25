import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import renderWithProviders, { makeAuthMocks } from '../../../../tests/test-utils.jsx';

// Mock the useTranslation hook before the module under test is imported.
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

let Navigation;

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Provide a global test i18n instance so modules that `require` the
  // runtime shim (instead of using vitest's vi.mock) will still get
  // the expected translation strings. This mirrors the vi.mock above.
  beforeEach(() => {
    globalThis.__TEST_I18N__ = {
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
      },
      language: 'en',
      changeLanguage: async () => Promise.resolve()
    };
  });

  it('renders navigation for regular users', async () => {
    // Mock the user as logged in via provider-injection
    const auth = makeAuthMocks({ currentUser: { name: 'Test User', is_admin: false }, logout: vi.fn() });

  // Load module after the mock is in place
  Navigation = (await import('../Navigation')).default;
  renderWithProviders(<Navigation />, { auth });

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

  it('renders navigation with admin links for admin users', async () => {
    // Mock the user as an admin via provider-injection
    const auth = makeAuthMocks({ currentUser: { name: 'Admin User', is_admin: true }, logout: vi.fn() });

  Navigation = (await import('../Navigation')).default;
  renderWithProviders(<Navigation />, { auth });

    // Check admin-specific link is visible
    expect(screen.getByTestId('admin-nav-item')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('does not render when user is not logged in', async () => {
    // Mock the user as not logged in via provider-injection
    const auth = makeAuthMocks({ currentUser: null });

  Navigation = (await import('../Navigation')).default;
  const { container } = renderWithProviders(<Navigation />, { auth });

  // The component should not render navigation UI when user is not logged in
  expect(screen.queryByTestId('side-navigation')).not.toBeInTheDocument();
  expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', async () => {
    // Mock the logout function
    const mockLogout = vi.fn();
    const auth = makeAuthMocks({ currentUser: { name: 'Test User', is_admin: false }, logout: mockLogout });

  Navigation = (await import('../Navigation')).default;
  renderWithProviders(<Navigation />, { auth });

    // Click the logout button
    screen.getByTestId('logout-button').click();
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders the correct number of navigation items', async () => {
    // Mock the user as logged in via provider-injection
    const auth = makeAuthMocks({ currentUser: { name: 'Test User', is_admin: false } });

  Navigation = (await import('../Navigation')).default;
  renderWithProviders(<Navigation />, { auth });

    // Check the number of navigation items (5 for regular users)
    const navItems = screen.getAllByRole('listitem');
    expect(navItems.length).toBe(5);
  });
});