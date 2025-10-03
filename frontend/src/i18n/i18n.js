// Reuse the same i18n singleton across both import paths (./i18n and
// ./i18n/i18n) by reading/writing a global key. This avoids multiple
// initializations that can lead to module re-import races in Vitest.
// Re-export the root i18n module so both import paths resolve to the same
// singleton. This avoids duplicate initialization and module re-import
// races in Vitest worker environments.
import i18n from '../i18n';
export default i18n;