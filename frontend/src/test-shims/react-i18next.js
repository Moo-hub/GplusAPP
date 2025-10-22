// Lightweight ESM shim for react-i18next used during tests.
// Provides a minimal API: useTranslation, getFixedT, I18nextProvider and default export.
function humanize(raw) {
  try {
    if (typeof raw !== 'string') return raw;
    let key = raw;
    if (key.indexOf('.') !== -1) {
      const parts = key.split('.');
      key = parts[parts.length - 1] || key;
    }
    key = key.replace(/[-_]/g, ' ');
    key = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    key = String(key).trim();
    if (key.length === 0) return raw;
    return key.charAt(0).toUpperCase() + key.slice(1);
  } catch (e) {
    return raw;
  }
}

export function useTranslation() {
  // Allow tests to inject a global translation helper via globalThis.__TEST_I18N__
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__TEST_I18N__ && typeof globalThis.__TEST_I18N__.t === 'function') {
      return { t: globalThis.__TEST_I18N__.t, i18n: globalThis.__TEST_I18N__ };
    }
  } catch (e) {}
  return { t: (k) => humanize(k), i18n: { language: (typeof globalThis !== 'undefined' && globalThis.__TEST_I18N__ && globalThis.__TEST_I18N__.language) || 'en', changeLanguage: async () => Promise.resolve(), getFixedT: () => ((kk) => humanize(kk)) } };
}

export function getFixedT() { return (k) => humanize(k); }

export const I18nextProvider = ({ children }) => (children || null);

const _default = { t: (k) => humanize(k), getFixedT: () => ((k) => humanize(k)), changeLanguage: async () => Promise.resolve() };
export default _default;
