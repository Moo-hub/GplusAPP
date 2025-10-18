import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// I18n provider is optional in tests — prefer global test instance if present
let I18nextProvider;
let testI18n = null;
try {
  // lazily require to avoid import-time resolution in some test workers
  // eslint-disable-next-line global-require
  I18nextProvider = require('react-i18next').I18nextProvider;
  try { testI18n = require('../i18n/test-i18n.js').default; } catch (e) { testI18n = globalThis.__TEST_I18N__ || null; }
} catch (e) {
  I18nextProvider = null;
  testI18n = globalThis.__TEST_I18N__ || null;
}
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { LoadingProvider } from '../contexts/LoadingContext.jsx';
import { ToastProvider } from '../contexts/ToastContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../styles/ThemeProvider';

export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
      <MemoryRouter>
        {I18nextProvider && testI18n ? (
          <I18nextProvider i18n={testI18n}>
            <QueryClientProvider client={qc}>
              <AuthProvider>
                <LoadingProvider>
                  <ToastProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                  </ToastProvider>
                </LoadingProvider>
              </AuthProvider>
            </QueryClientProvider>
          </I18nextProvider>
        ) : (
          <QueryClientProvider client={qc}>
            <AuthProvider>
              <LoadingProvider>
                <ToastProvider>
                  <ThemeProvider>{children}</ThemeProvider>
                </ToastProvider>
              </LoadingProvider>
            </AuthProvider>
          </QueryClientProvider>
        )}
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export default renderWithProviders;
