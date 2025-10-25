import { render } from '@testing-library/react';
// Import a lightweight test i18n config (create one if missing)
import i18n from '../../src/i18n/test-i18n.js';

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
