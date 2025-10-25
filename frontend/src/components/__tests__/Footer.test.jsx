// No duplicate imports found. No changes needed.
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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

import Footer from '../Footer';
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
    
    expect(screen.getByTestId('copyright')).toHaveTextContent(/\u00a9 2025 g\+ (recycling|footer\.recycling)/i);
    
    // Restore original Date
    global.Date = originalDate;
  });
  
  it('renders footer links', () => {
    render(<Footer />);
    
    // Check that all footer links are rendered
    expect(screen.getByTestId('terms-link')).toHaveTextContent(/terms of service|footer\.terms/i);
    expect(screen.getByTestId('terms-link')).toHaveAttribute('href', '/terms');
    
    expect(screen.getByTestId('privacy-link')).toHaveTextContent(/privacy policy|footer\.privacy/i);
    expect(screen.getByTestId('privacy-link')).toHaveAttribute('href', '/privacy');
    
    expect(screen.getByTestId('contact-link')).toHaveTextContent(/contact us|footer\.contact/i);
    expect(screen.getByTestId('contact-link')).toHaveAttribute('href', '/contact');
  });
  
  it('has the correct styling classes', () => {
    render(<Footer />);
    
    // Check that the footer has the correct CSS classes
    expect(screen.getByTestId('site-footer')).toHaveClass('site-footer');
    expect(screen.getByTestId('footer-content')).toHaveClass('footer-content');
  });
});