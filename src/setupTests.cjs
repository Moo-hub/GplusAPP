// CommonJS shim that dynamically imports the frontend ESM test setup.
// Some Vitest/Vite resolution modes try to load a repo-root `src/setupTests.js`
// and hit ESM transform/loader issues. Providing a small CJS shim here keeps
// the repo-root module surface CJS-friendly and forwards to the frontend
// setup which contains the larger ESM-based shims (MSW, jsdom stubs, etc.).

(async () => {
  try {
    // Relative path from repo-root `src/` to `frontend/src/setupTests.js`
    await import('../frontend/src/setupTests.js');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to import frontend/setupTests.js from CJS shim:', err && err.message ? err.message : err);
    throw err;
  }
})();

// Export an empty object so callers using require(...) get a defined value.
module.exports = {};
