// Minimal i18n shim for tests. Provides the methods/components tests expect.
import en from '../locales/en.json';

// Helper to resolve nested keys like 'pickup.submit' into the en.json object
function resolveKey(obj, key) {
  if (!key) return '';
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur;
}

const translations = en || {};

const i18n = {
  language: 'en',
  t: (key, _opts) => {
    if (!key || typeof key !== 'string') return '';
    const v = resolveKey(translations, key);
    if (typeof v === 'string') return v;
    // Fallback: try last segment or raw key
    const last = key.split('.').slice(-1)[0];
    return translations[last] || last || key;
  },
  changeLanguage: async (lng) => { i18n.language = lng; return Promise.resolve(); },
  use: () => i18n,
  init: async () => Promise.resolve(i18n),
  on: () => {},
  off: () => {},
};

export default i18n;

export const useTranslation = () => ({ t: i18n.t, i18n });

export const I18nextProvider = ({ children }) => children;
