// Minimal i18n stub for tests. Provide a slightly richer surface so the
// real `react-i18next` helpers (useTranslation / I18nextProvider) can use
// this object without needing the full i18next library.
const resources = {
  en: {
    translation: {
      app: { title: 'G+ App' },
      points: { title: 'Points Balance' },
      profile: { email: 'Email' },
      nav: { hello: 'Hello, {{name}}' },
      credit_card: 'Credit Card',
      wallet: 'Wallet',
      bank_transfer: 'Bank Transfer',
    },
  },
  ar: {
    translation: {
      app: { title: 'تطبيق G+' },
      points: { title: 'رصيد النقاط' },
      profile: { email: 'البريد الإلكتروني' },
      nav: { hello: 'مرحبا، {{name}}' },
    },
  },
};

const i18n = {
  options: { react: {} },
  language: 'en',
  languages: ['en'],
  isInitialized: true,
  initializedStoreOnce: true,
  changeLanguage: async (lng) => { i18n.language = lng; i18n.languages = [lng]; },
  on: () => {},
  off: () => {},
  init: async () => {},
  getResourceBundle: (lng, ns) => ((resources[lng] && resources[lng][ns]) ? resources[lng][ns] : {}),
  // getFixedT signature used by react-i18next: getFixedT(lng, ns, keyPrefix)
  getFixedT: (lng, ns, keyPrefix) => {
    return (key, opts) => {
      // Apply simple dot-notation lookup in our resources
      const lang = (typeof lng === 'string' && lng) || i18n.language || 'en';
      const bundle = (resources[lang] && resources[lang].translation) || {};
      const parts = String(key).split('.');
      let val = bundle;
      for (const p of parts) {
        if (val && Object.prototype.hasOwnProperty.call(val, p)) val = val[p]; else { val = null; break; }
      }
      let out = (val !== null && typeof val !== 'undefined') ? val : key;
      if (opts && typeof opts === 'object') {
        Object.keys(opts).forEach(k => { out = String(out).replace(`{{${k}}}`, opts[k]); });
      }
      return out;
    };
  },
  // Convenience t() function so code that calls `i18n.t(...)` works just like
  // the real i18next instance. Delegate to getFixedT using the current language
  // and the default 'translation' namespace.
  t: (key, opts) => {
    try {
      const lang = i18n.language || 'en';
      const fn = i18n.getFixedT(lang, 'translation');
      return fn(key, opts);
    } catch (e) {
      return key;
    }
  },
  // Helpers expected by react-i18next utils
  hasResourceBundle: (lng, ns) => {
    try {
      return !!(resources[lng] && (resources[lng][ns] || resources[lng].translation));
    } catch (e) { return false; }
  },
  loadNamespaces: (ns, cb) => { try { cb(); } catch (e) { /* ignore */ } },
  hasLoadedNamespace: (ns) => true,
  services: { backendConnector: { state: {}, backend: false } },
};

export default i18n;
