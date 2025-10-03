import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import Layout from '../Layout';
import { checkAccessibilityRoles } from '../../utils/test-utils/accessibility';

// Mock the auth context used by Layout/Navigation so tests render authenticated UI
const mockAuth = {
  currentUser: { id: 2, name: 'Test User', email: 'test@example.com', is_admin: false },
  loading: false,
  login: () => {},
  logout: () => {},
  refreshProfile: () => Promise.resolve(null)
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth
}));

// Configure jest-axe
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'link-name': { enabled: true },
    'landmark-banner-is-top-level': { enabled: true }
  }
});

describe('Navigation Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });
  
  it('should have no accessibility violations when authenticated', async () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper navigation landmark roles', async () => {
    await checkAccessibilityRoles(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
      ['navigation']
    );
  });
  
  it('should have accessible dropdown menu', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Find the user menu button (this would need to be adjusted based on actual implementation)
    const userMenuButton = screen.getByRole('button', { name: /Test User/i });
    
    // Check that the button has proper ARIA attributes for a menu
    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
  });
  
  it('should have skip link for keyboard accessibility', async () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // Check for skip link (common accessibility feature). Use selector
    // because the visible text may be translated in different locales.
    const skipLink = document.querySelector('.skip-link') || document.querySelector('a[href="#main-content"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });
  
  it('should have proper keyboard navigation order', async () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    
    // Get all focusable elements in the navigation
    const focusableElements = screen.getAllByRole('link');
    
    // Check that they have a logical tab order (assumes tabIndex is set correctly)
    focusableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      // Either no tabIndex (natural order) or a non-negative value
      expect(tabIndex === null || parseInt(tabIndex) >= 0).toBeTruthy();
    });
  });
});