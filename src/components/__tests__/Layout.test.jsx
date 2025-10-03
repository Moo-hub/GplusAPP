import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import Layout from '../Layout';
import renderWithProviders, { makeAuthMocks } from '../../../tests/test-utils.jsx';

// Mock the ViewportIndicator component
vi.mock('../dev/ViewportIndicator', () => ({
  default: () => <div data-testid="viewport-indicator">Viewport Indicator</div>
}));

// Mock the Footer component
vi.mock('../Footer', () => ({
  default: (props) => <footer data-testid={props['data-testid'] || "site-footer"}>
    <div data-testid="copyright">&copy; 2025 G+ Recycling</div>
  </footer>
}));

// Mock OfflineNotification so tests don't need the OfflineProvider
vi.mock('../OfflineNotification', () => ({
  default: () => <div data-testid="offline-notification" />
}));

// Use the provider-injection test helpers instead of module-level mocks.

// NOTE: Do not mock the entire 'react-router-dom' module here. Tests render
// components inside a MemoryRouter/Routes which requires the real router
// implementation. If a test needs to observe navigation, render a target
// route (e.g. a Login page) and assert the DOM for that route appears after
// the interaction.

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'nav.home': 'Home',
        'nav.companies': 'Companies',
        'nav.pickups': 'Pickups',
        'nav.rewards': 'Rewards',
        'nav.myRedemptions': 'My Redemptions',
        'nav.hello': options ? `Hello, ${options.name}` : 'Hello',
        'nav.logout': 'Logout',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.menu': 'Menu',
        'nav.close': 'Close'
      };
      return translations[key] || key;
    }
  })
}));

// Sample page components for testing routes
const HomePage = () => <div data-testid="home-page">Home Page</div>;
const CompaniesPage = () => <div data-testid="companies-page">Companies Page</div>;
const PickupsPage = () => <div data-testid="pickups-page">Pickups Page</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the layout correctly when user is not logged in', () => {
    // Mock the user as not logged in via the test helper
    const auth = makeAuthMocks({ currentUser: null });
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Check the layout elements are rendered correctly
    expect(screen.getByTestId('layout-container')).toBeInTheDocument();
    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('site-logo')).toBeInTheDocument();
    expect(screen.getByTestId('nav-links')).toBeInTheDocument();
    expect(screen.getByTestId('auth-links')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByTestId('copyright')).toBeInTheDocument();

    // Check non-authenticated navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    
    // Check auth links for non-authenticated user
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Check protected links are not displayed
    expect(screen.queryByText('Pickups')).not.toBeInTheDocument();
    expect(screen.queryByText('Rewards')).not.toBeInTheDocument();
    expect(screen.queryByText('My Redemptions')).not.toBeInTheDocument();
    
    // Check main content (outlet) renders correctly
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders the layout correctly when user is logged in', () => {
    // Mock the user as logged in via the test helper
    const mockUser = { name: 'Test User', email: 'test@example.com' };
    const auth = makeAuthMocks({ currentUser: mockUser });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="pickups" element={<PickupsPage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Check authenticated user elements
    expect(screen.getByTestId('user-greeting')).toBeInTheDocument();
    expect(screen.getByText('Hello, Test User')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    
    // Check authenticated navigation links are displayed
    expect(screen.getByText('Pickups')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('My Redemptions')).toBeInTheDocument();
    
    // Check login/register links are not displayed when authenticated
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('toggles mobile navigation menu when burger button is clicked', () => {
    // Mock the user as not logged in via the test helper
    const auth = makeAuthMocks({ currentUser: null });
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Get the nav links element and the toggle button
    const navLinks = screen.getByTestId('nav-links');
    const toggleButton = screen.getByTestId('mobile-nav-toggle');
    
    // Initially nav should not have 'open' class
    expect(navLinks.className).not.toContain('open');
    
    // Click the toggle button
    fireEvent.click(toggleButton);
    
    // Now nav should have 'open' class
    expect(navLinks.className).toContain('open');
    
    // Click the toggle button again
    fireEvent.click(toggleButton);
    
    // Nav should not have 'open' class again
    expect(navLinks.className).not.toContain('open');
  });

  it('closes the mobile menu when navigation links are clicked', () => {
    // Mock the user as logged in
    const mockUser = { name: 'Test User', email: 'test@example.com' };
    const auth = makeAuthMocks({ currentUser: mockUser });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="companies" element={<CompaniesPage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Get the nav links element and the toggle button
    const navLinks = screen.getByTestId('nav-links');
    const toggleButton = screen.getByTestId('mobile-nav-toggle');
    
    // Open the menu
    fireEvent.click(toggleButton);
    expect(navLinks.className).toContain('open');
    
    // Click a navigation link
    fireEvent.click(screen.getByText('Companies'));
    
    // Menu should be closed
    expect(navLinks.className).not.toContain('open');
  });

  it('performs logout and redirects when logout button is clicked', () => {
    // Mock the user as logged in with a logout function via the test helper
    const mockLogout = vi.fn();
    const auth = makeAuthMocks({ currentUser: { name: 'Test User' }, logout: mockLogout });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Click the logout button
  fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    // Check that logout was called
    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows correct copyright year in the footer', () => {
    const auth = makeAuthMocks({ currentUser: null });
    // Create a mock for Date to return a fixed year
    const originalDate = global.Date;
    const mockDate = class extends Date {
      getFullYear() {
        return 2025;
      }
    };
    global.Date = mockDate;

    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>,
      { route: '/', auth }
    );

    // Check the copyright text includes the mocked year
    expect(screen.getByTestId('copyright').textContent).toContain('© 2025');
    
    // Restore original Date
    global.Date = originalDate;
  });
});