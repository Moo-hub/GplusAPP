// Minimal i18n shim for tests. Provides the methods/components tests expect.
// Prefer the i18n module's locales (used by unit tests); fall back to app locales.
import React from 'react';
import enI18n from '../i18n/locales/en.json';
import enApp from '../locales/en.json';

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

const translations = enI18n || enApp || {};

const i18n = {
  language: 'en',
  t: (key, opts) => {
      if (!key || typeof key !== 'string') return '';
    let v = resolveKey(translations, key);
    if (typeof v === 'string') {
      // Simple mustache-style interpolation
      if (opts && typeof opts === 'object') {
        v = v.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (opts[name] != null ? String(opts[name]) : ''));
      }
      return v;
    }
    // Fallback: prefer the last segment or raw key, avoiding objects
    const last = key.split('.').slice(-1)[0];
    const lastVal = translations[last];
    const fallback = typeof lastVal === 'string' ? lastVal : (last || key);
    if (opts && typeof opts === 'object' && typeof fallback === 'string') {
      return fallback.replace(/{{\s*(\w+)\s*}}/g, (_, name) => (opts[name] != null ? String(opts[name]) : ''));
    }
    return fallback;
  },
  changeLanguage: async (lng) => { i18n.language = lng; return Promise.resolve(); },
  use: () => i18n,
  init: async () => Promise.resolve(i18n),
  on: () => {},
  off: () => {},
};

// React-aware hook/context so test suites that provide a real i18n instance via
// I18nextProvider (from this shim) can exercise language switching and proper
// resource resolution. Falls back to the minimal shim above when no provider.
const I18nContext = React.createContext(null);

export const I18nextProvider = ({ i18n: provided, children }) => (
  React.createElement(I18nContext.Provider, { value: provided || null }, children)
);

export const useTranslation = () => {
  const ctx = React.useContext ? React.useContext(I18nContext) : null;
  if (ctx && typeof ctx.t === 'function') {
    return { t: (k, opts) => ctx.t(k, opts), i18n: ctx };
  }
  return { t: (k, opts) => i18n.t(k, opts), i18n };
};

export default i18n;
