import { screen, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the i18next translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'errors.pageNotFound': 'Page not found',
        'common.backToHome': 'Back to Home'
      };
      return translations[key] || key;
    }
  })
}));

describe('NotFound Component', () => {
  it('renders the 404 page correctly', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    
    // Check that the container is rendered
    const container = screen.getByTestId('not-found-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('not-found');
    
    // Check for the 404 heading
    const title = screen.getByTestId('not-found-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('404');
    
    // Check for the error message
    const message = screen.getByTestId('not-found-message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('Page not found');
    
    // Check for the back to home link
    const homeLink = screen.getByTestId('back-to-home-link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent('Back to Home');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('btn-primary');
  });
});