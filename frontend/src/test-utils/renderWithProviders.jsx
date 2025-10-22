import { render } from '@testing-library/react';
// I18n provider is optional in tests — prefer global test instance if present
// Delay resolving react-i18next until render time so setupFiles (which may
// mock react-i18next) have a chance to run and install stable mocks. This
// avoids import-time races where modules call i18n.getFixedT before tests
// have configured a test-friendly i18n instance.
let I18nextProvider = null;
let testI18n = null;
import { QueryClient } from '@tanstack/react-query';

export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    // Resolve i18n provider and test instance at render time to honor
    // any mocks created in `setupTests.js`.
    try {
      // eslint-disable-next-line global-require
      const r = require('react-i18next');
      I18nextProvider = r && r.I18nextProvider ? r.I18nextProvider : I18nextProvider;
    } catch (e) {
      // ignore: provider will be null and we'll fall back to global test i18n
    }
    try { testI18n = require('../i18n/test-i18n.js').default; } catch (e) { testI18n = globalThis.__TEST_I18N__ || null; }
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
