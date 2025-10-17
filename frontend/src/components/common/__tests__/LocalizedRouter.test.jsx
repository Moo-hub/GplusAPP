import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LocalizedRouter from '../LocalizedRouter';

// Mock hooks
jest.mock('../../../hooks/useLocalizedRouting', () => ({
  useLocalizedRouting: () => ({
    currentInternalPath: '/products',
    params: {},
    getFullLocalizedPath: (path) => `/en${path}`
  })
}));

// Mock useLanguage hook
jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    supportedLanguages: ['en', 'ar']
  })
}));

describe('LocalizedRouter', () => {
  test('renders children correctly', async () => {
    const TestComponent = () => <div>Test Content</div>;
    
    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider initialLanguage="en">
          <MemoryRouter initialEntries={['/en/products']}>
            <LocalizedRouter>
              <Routes>
                <Route path="/products" element={<TestComponent />} />
              </Routes>
            </LocalizedRouter>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>
    );
    
    await waitFor(() => {
      expect(getByText('Test Content')).toBeInTheDocument();
    });
  });
});