// Minimal test shim for react-i18next used only in Vitest runs.
export function useTranslation() {
  return { t: (k) => (typeof k === 'string' ? k : k), i18n: { language: 'en', getFixedT: () => (k) => (typeof k === 'string' ? k : k), changeLanguage: async () => Promise.resolve() } };
}

export const I18nextProvider = ({ children }) => children;

export function getFixedT() { return (k) => (typeof k === 'string' ? k : k); }

export const Trans = ({ children }) => children || null;

export default { t: (k) => (typeof k === 'string' ? k : k), getFixedT: () => (k) => (typeof k === 'string' ? k : k) };
