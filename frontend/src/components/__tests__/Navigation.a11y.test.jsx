import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { checkAccessibilityRoles } from '../../utils/test-utils/accessibility';

// Create mock for the auth context
const mockAuth = {
  isAuthenticated: true,
  user: { name: 'Test User' },
  logout: () => {}
};

// Mock the auth context
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
        <Navigation />
      </MemoryRouter>
    );
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper navigation landmark roles', async () => {
    await checkAccessibilityRoles(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>,
      ['navigation']
    );
  });
  
  it('should have accessible dropdown menu', async () => {
    render(
      <MemoryRouter>
        <Navigation />
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
        <Navigation />
      </MemoryRouter>
    );
    
    // Check for skip link (common accessibility feature)
    const skipLink = screen.getByText(/skip to content/i);
    expect(skipLink).toHaveAttribute('href', '#main-content');
    
    // Skip link should be visually hidden but focusable
    const styles = window.getComputedStyle(skipLink);
    expect(styles.position).toBe('absolute');
    
    // When focused, it should become visible (this would need styling check)
    skipLink.focus();
    // After focus, the link should be visible in some way
    // This test would need actual style verification based on your implementation
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