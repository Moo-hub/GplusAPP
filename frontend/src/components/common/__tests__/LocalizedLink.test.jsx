import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LocalizedLink from '../LocalizedLink';

// Mock hooks
jest.mock('../../../hooks/useLocalizedRouting', () => ({
  useLocalizedLink: () => (path, params = {}) => {
    // Simple mock implementation for testing
    if (path === '/products') {
      return '/en/products';
    } else if (path === '/about') {
      return '/en/about';
    } else if (path.includes(':id')) {
      const resolvedPath = path.replace(':id', params.id || '1');
      return `/en${resolvedPath}`;
    }
    return `/en${path}`;
  }
}));

describe('LocalizedLink', () => {
  const renderComponent = (to, children) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LocalizedLink to={to}>{children}</LocalizedLink>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
  };

  test('renders a link with correct localized path', () => {
    renderComponent('/products', 'Products');
    
    const link = screen.getByText('Products');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/en/products');
  });

  test('passes other props to the Link component', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LocalizedLink to="/about" className="test-class" data-testid="test-link">
              About
            </LocalizedLink>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    const link = screen.getByTestId('test-link');
    expect(link).toHaveClass('test-class');
    expect(link.getAttribute('href')).toBe('/en/about');
  });

  test('handles dynamic parameters in paths', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LocalizedLink to="/products/:id" params={{ id: '123' }}>
              Product 123
            </LocalizedLink>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    const link = screen.getByText('Product 123');
    expect(link.getAttribute('href')).toBe('/en/products/123');
  });
});