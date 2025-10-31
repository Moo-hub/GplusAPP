// __mocks__/react-i18next.js
const vi = require('vitest').vi;

const i18n = {
  language: 'en',
  languages: ['en', 'ar'],
  changeLanguage: vi.fn(),
  t: vi.fn((key) => key),
  dir: vi.fn(() => 'ltr'),
  on: vi.fn(),
  off: vi.fn(),
  exists: vi.fn(() => true),
  getFixedT: vi.fn(() => (key) => key),
};

function useTranslation() {
  return {
    t: i18n.t,
    i18n,
  };
}

function I18nextProvider({ children }) {
  return children;
}

module.exports = {
  useTranslation,
  I18nextProvider,
  Trans: ({ children }) => children,
  withTranslation: () => (Component) => Component,
  Translation: ({ children }) => children({ t: i18n.t, i18n }),
  I18nContext: { Provider: I18nextProvider },
  initReactI18next: { type: '3rdParty', init: vi.fn() },
};
