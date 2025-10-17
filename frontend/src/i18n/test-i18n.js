// Minimal i18n stub for tests. Avoid initializing real react-i18next plugin to
// prevent version/initialization issues in the Vitest environment.
const i18n = {
  t: (key, opts) => {
    // If opts contains interpolation values, do a simple replacement
    if (opts && typeof opts === 'object') {
      return Object.keys(opts).reduce((s, k) => s.replace(`{{${k}}}`, opts[k]), key);
    }
    return key;
  },
  changeLanguage: async () => {},
  language: 'en',
  on: () => {},
  off: () => {},
  init: async () => {},
  // react-i18next expects an `options.react` object when using useTranslation
  // in some versions; provide a minimal shape to avoid runtime errors in tests.
  options: {
    react: {
      useSuspense: false,
    },
  },
};

export default i18n;
