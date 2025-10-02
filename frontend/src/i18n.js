// Single-source i18n initialization. Keep imports at top-level so tooling
// and bundlers parse this file consistently. In Vitest we mock 'i18next'
// in `setupTests.js` which makes this safe to import in worker contexts.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  de: { translation: de },
  es: { translation: es },
};

const GLOBAL_KEY = '__GPLUS_I18N__';

let i18nInstance = (typeof globalThis !== 'undefined' && globalThis[GLOBAL_KEY]) || i18n;

try {
  if (!i18nInstance.isInitialized) {
    i18nInstance
      .use(initReactI18next)
      .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
      });
  }
} catch (e) {
  // Ignore initialization errors in constrained test environments
}

if (typeof globalThis !== 'undefined') globalThis[GLOBAL_KEY] = i18nInstance;

export default i18nInstance;

