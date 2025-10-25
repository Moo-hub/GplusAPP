// Test helper to provide a deterministic test i18n instance
// This file is intended to be included in Vitest's setupFiles so tests
// don't need to manually set globalThis.__TEST_I18N__ in each file.

function humanizeKey(key) {
  if (typeof key !== 'string') return key;
  const last = key.split('.').slice(-1)[0] || key;
  const spaced = last.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  const words = spaced.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(' ');
}

export function setupTestI18n({ t = (k) => humanizeKey(k), language = 'en' } = {}) {
  globalThis.__TEST_I18N__ = { t, i18n: { language, changeLanguage: () => {} } };
}

export function teardownTestI18n() {
  try { delete globalThis.__TEST_I18N__; } catch (e) {}
}

// Auto-setup default identity translator if running under test environment
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  setupTestI18n();
}
