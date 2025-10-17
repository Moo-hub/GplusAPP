import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'footer.recycling': 'Recycling',
        'footer.terms': 'Terms of Service',
        'footer.privacy': 'Privacy Policy',
        'footer.contact': 'Contact Us'
      };
      return translations[key] || key;
    }
  })
}));

describe('Footer Component', () => {
  it('renders the footer with copyright information', () => {
    // Create a mock date for consistent testing
    const originalDate = global.Date;
    const mockDate = class extends Date {
      getFullYear() {
        return 2025;
      }
    };
    global.Date = mockDate;

    render(<Footer />);
    
    // Check that copyright year is displayed correctly
    expect(screen.getByTestId('copyright')).toHaveTextContent('© 2025 G+ Recycling');
    
    // Restore original Date
    global.Date = originalDate;
  });
  
  it('renders footer links', () => {
    render(<Footer />);
    
    // Check that all footer links are rendered
    expect(screen.getByTestId('terms-link')).toHaveTextContent('Terms of Service');
    expect(screen.getByTestId('terms-link')).toHaveAttribute('href', '/terms');
    
    expect(screen.getByTestId('privacy-link')).toHaveTextContent('Privacy Policy');
    expect(screen.getByTestId('privacy-link')).toHaveAttribute('href', '/privacy');
    
    expect(screen.getByTestId('contact-link')).toHaveTextContent('Contact Us');
    expect(screen.getByTestId('contact-link')).toHaveAttribute('href', '/contact');
  });
  
  it('has the correct styling classes', () => {
    render(<Footer />);
    
    // Check that the footer has the correct CSS classes
    expect(screen.getByTestId('site-footer')).toHaveClass('site-footer');
    expect(screen.getByTestId('footer-content')).toHaveClass('footer-content');
  });
});