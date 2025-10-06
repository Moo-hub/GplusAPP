import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
// Import a lightweight test i18n config (create one if missing)
import i18n from '../../src/i18n/test-i18n.js';
import { AuthProvider } from '../../src/contexts/AuthContext.jsx';
import { LoadingProvider } from '../../src/contexts/LoadingContext.jsx';
import { ToastProvider } from '../../src/contexts/ToastContext.jsx';

export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <LoadingProvider>
              <ToastProvider>{children}</ToastProvider>
            </LoadingProvider>
          </AuthProvider>
        </I18nextProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export default renderWithProviders;
