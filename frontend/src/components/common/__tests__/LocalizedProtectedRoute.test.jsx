import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LocalizedProtectedRoute from '../LocalizedProtectedRoute';

// Mock hooks
jest.mock('../../../hooks/useLocalizedRouting', () => ({
  useLocalizedLink: () => (path) => {
    return `/en${path}`;
  }
}));

describe('LocalizedProtectedRoute', () => {
  const ProtectedContent = () => <div>Protected Content</div>;
  
  test('renders children when user is authenticated', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LocalizedProtectedRoute isAuthenticated={true} redirectTo="/login">
              <ProtectedContent />
            </LocalizedProtectedRoute>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to login when user is not authenticated', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter>
            <LocalizedProtectedRoute isAuthenticated={false} redirectTo="/login">
              <ProtectedContent />
            </LocalizedProtectedRoute>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    // The component should redirect, so protected content should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});