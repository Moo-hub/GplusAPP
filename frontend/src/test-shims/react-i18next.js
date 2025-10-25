// Lightweight ESM shim for react-i18next used during tests.
// Provides a minimal API: useTranslation, getFixedT, I18nextProvider and default export.
function humanize(raw) {
  if (typeof raw !== 'string') return raw;
  // eslint-disable-next-line no-console
  console.log('[DEBUG humanize] raw input:', raw);
  // Replace dots, dashes, and underscores with spaces
  let key = raw.replace(/[._-]+/g, ' ');
  // Insert spaces before camelCase capitals
  key = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  key = String(key).trim();
  if (key.length === 0) return raw;
  // Capitalize each word
  return key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function useTranslation() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__TEST_I18N__ && typeof globalThis.__TEST_I18N__.t === 'function') {
      const realT = globalThis.__TEST_I18N__.t;
      const t = (key, options) => {
        const val = realT(key, options);
        if (val === null || val === undefined || val === '') {
          // Always pass the full key to humanize
          if (key && key.includes('non.existent')) {
            // eslint-disable-next-line no-console
            console.log('[DEBUG i18n-shim] fallback to humanize(', key, ') =>', humanize(key));
          }
          return humanize(key);
        }
        return val;
      };
      return { t, i18n: globalThis.__TEST_I18N__ };
    }
  } catch (e) {}
  return { t: (k, options) => (typeof k === 'string' ? k : k), i18n: { language: (typeof globalThis !== 'undefined' && globalThis.__TEST_I18N__ && globalThis.__TEST_I18N__.language) || 'en', changeLanguage: async () => Promise.resolve(), getFixedT: () => ((kk) => (typeof kk === 'string' ? kk : kk)) } };
}

export function getFixedT() { return (k) => humanize(k); }

export const I18nextProvider = ({ children }) => (children || null);

const _default = { t: (k) => humanize(k), getFixedT: () => ((k) => humanize(k)), changeLanguage: async () => Promise.resolve() };
export default _default;
