// Repository-root shim to ensure older/incorrect imports like
// import 'src/setupTests.js' still resolve to the canonical
// frontend setup file. This keeps test suites working when they
// reference the workspace root instead of the frontend package.
try {
  // Prefer ESM dynamic import so this file works regardless of
  // CJS/ESM interop in the worker environment.
  // eslint-disable-next-line no-void
  void import('./frontend/src/setupTests.js').catch(() => {});
} catch (e) {
  try {
    // Fallback to require if available
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require('./frontend/src/setupTests.js');
  } catch (err) {
    // Best-effort shim: swallow errors so tests can continue to run
  }
}
// Lightweight ESM shim that delegates to the CommonJS shim `src/setupTests.cjs`.
// Some Vitest/Vite resolution modes attempt to load `src/setupTests.js` and
// trip over ESM transform of the larger frontend setup file. Requiring the
// small CJS shim here prevents Vite from directly transforming the frontend
// ESM bootstrap and keeps the repo-root surface CJS-friendly.
// Minimal ESM forwarder: directly import the frontend setup file so Vite and
// Vitest can resolve the actual test bootstrap from the frontend package.
// Keeping this file tiny avoids transform issues in some Vitest/Vite modes.
// Debug helper: log when the repo-root shim is executed so we can observe
// whether Vitest workers attempt to load this path during full runs.
// Keep logs minimal to avoid polluting test output; CI logs capture these.
/* eslint-disable no-console */
console.log('[TEST BOOTSTRAP] repo-root src/setupTests.js loaded');
/* eslint-enable no-console */

import '../frontend/src/setupTests.js';

// Export nothing; the imported module performs side-effects (mocks, MSW start,
// global shims) necessary for tests.
export {};