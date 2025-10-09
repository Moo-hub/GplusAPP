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