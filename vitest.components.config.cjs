const { defineConfig } = require('vite');
// const react = require('@vitejs/plugin-react');
const path = require('path');

// CommonJS config to avoid ESM __dirname/import.meta issues when Vitest
// bundles the config. This file lives at repo root and references files
// under the frontend/ directory.
module.exports = defineConfig({
  // Include the React plugin so Vite transforms JSX/TSX in imported frontend
  // source files during tests. We keep this minimal (no additional plugin
  // options) to allow correct parsing of .jsx files in the frontend folder.
  plugins: [
    // Use automatic runtime and explicitly include frontend source files so
    // the plugin can reliably detect JSX preambles during import analysis.
  // react({ jsxRuntime: 'automatic', include: [/frontend\/src\/.+\\.[jt]sx?$/] })
  ],
  // Ensure Vitest uses the repository root so repo-level tests are discovered
  root: __dirname,
  test: {
    environment: 'jsdom',
    globals: true,
    // Ensure Vite transforms JSX/TSX files for the web (jsdom) environment
    // so the React plugin can detect the JSX preamble during import analysis.
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    // setup file lives in frontend/src (use absolute path)
    setupFiles: [path.resolve(__dirname, 'frontend', 'src', 'setupTests.js')],
    // Include both frontend-local and repo-root legacy tests using relative globs
    // Use compact globs so Vitest discovers tests correctly when --config is used.
    include: [
      'tests/components/**/*.test.{js,jsx,ts,tsx}',
      'tests/components/**/*.spec.{js,jsx,ts,tsx}',
      'frontend/src/**/*.test.{js,jsx,ts,tsx}',
      'frontend/src/**/*.spec.{js,jsx,ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        'src/test-utils.js',
      ]
    }
  },
  resolve: {
    // Include 'node' so packages that export './node' (like msw/node)
    // resolve correctly when running in the Vitest environment.
    conditions: ['development', 'browser', 'node'],
  // Force Vite to dedupe these modules to a single copy to avoid duplicate
  // React/ReactDOM instances which cause invalid hook call errors in tests.
  // Also dedupe msw and its interceptors so the test runner and app share
  // the same copies (prevents missed interception due to duplicate modules).
  dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-i18next', '@testing-library/react', 'msw', '@mswjs/interceptors'],
    alias: [
      // Map react-icons/fa to a lightweight shim for tests
  { find: 'react-icons/fa', replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'react-icons-fa.js') },
      // Ensure any direct import of the websocket service resolves to our test shim
      // This must come before the general ../services mapping so it wins.
      { find: /(?:\.|.*)services\/websocket\.service$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'websocket.service.js') },
      // Local frontend aliases (make these first so they win during resolution)
      { find: /^\.\.\/components\/(.*)/, replacement: path.resolve(__dirname, 'frontend/src/components/$1') },
  { find: /^\.\.\/services\/(.*)/, replacement: path.resolve(__dirname, 'frontend/src/services/$1') },
      { find: /^\.\.\/components\/common\/(.*)/, replacement: path.resolve(__dirname, 'frontend/src/components/common/$1') },
      { find: /^\.\.\/contexts\/(.*)/, replacement: path.resolve(__dirname, 'frontend/src/contexts/$1') },
      { find: /^frontend\/(.*)/, replacement: path.resolve(__dirname, 'frontend/src/$1') },
      // Test shims for packages not installed in the test runtime or that
      // cause transform/resolution issues in Vitest. These point to small
      // synchronous modules inside frontend so imports resolve reliably.
      { find: 'react-redux', replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'react-redux.js') },
    { find: 'react-icons/bs', replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'react-icons-bs.js') },
  // Also match any subpath under react-icons/bs (e.g. 'react-icons/bs/index')
  { find: /^react-icons\/bs(\/.*)?$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'react-icons-bs.js') },
  // Generic alias for react-icons to map any other icon families to the
  // test-shims directory. Placed after specific family mappings so the
  // family-level alias (e.g. react-icons/bs) wins during resolution.
  { find: 'react-icons', replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims') },
  // Force single module copies from the repository root so the test runner,
  // setup files and frontend code all resolve the same React and router
  // instances. Pointing to the root node_modules reduces duplicate copies
  // caused by multiple package.json files in the repo.
  // Point core libs to the frontend/ package copy so frontend source and
  // test setup resolve a single instance from frontend/node_modules.
  // Force React and ReactDOM to resolve to the repository root node_modules so
  // every package and the test runner uses the same module instances.
  { find: 'react', replacement: path.resolve(__dirname, 'node_modules', 'react') },
  { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules', 'react-dom') },
  // Ensure internal/react-dom client imports also resolve to the same root copy
  { find: 'react-dom/client', replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'client') },
  // Map JSX runtime entries to the same root React copy
  { find: 'react/jsx-runtime', replacement: path.resolve(__dirname, 'node_modules', 'react', 'jsx-runtime') },
  { find: 'react/jsx-dev-runtime', replacement: path.resolve(__dirname, 'node_modules', 'react', 'jsx-dev-runtime') },
  // Map internal CJS entrypoints used by some packages/tests to the root copies
  { find: /^react\/cjs\/(.*)/, replacement: path.resolve(__dirname, 'node_modules', 'react', 'cjs', '$1') },
  { find: /^react-dom\/cjs\/(.*)/, replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'cjs', '$1') },
  // Ensure testing libraries resolve to the repository root node_modules so
  // the test runner and frontend code share the same instances.
  { find: '@testing-library/react', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'react') },
  { find: '@testing-library/dom', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'dom') },
  { find: '@testing-library/user-event', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'user-event') },
  { find: '@testing-library/jest-dom', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'jest-dom') },
  { find: 'react-i18next', replacement: path.resolve(__dirname, 'node_modules', 'react-i18next') },
  { find: 'react-router-dom', replacement: path.resolve(__dirname, 'node_modules', 'react-router-dom') },
  // Ensure MSW and its node entry resolve to the frontend package copy so
  // setupServer and interceptors operate on the same instances inside Vitest.
  { find: 'msw', replacement: path.resolve(__dirname, 'frontend', 'node_modules', 'msw') },
  { find: 'msw/node', replacement: path.resolve(__dirname, 'frontend', 'node_modules', 'msw', 'lib', 'node') },
  { find: '@mswjs/interceptors', replacement: path.resolve(__dirname, 'frontend', 'node_modules', '@mswjs', 'interceptors') },
  // Ensure axios resolves to the frontend copy so setup and app use the
  // same adapter and instance during tests.
  { find: 'axios', replacement: path.resolve(__dirname, 'frontend', 'node_modules', 'axios') },
  // Also force 'react-router' to the root copy so internal imports used by
  // react-router-dom resolve to the same instance and avoid duplicate
  // React copies which cause invalid hook call errors in tests.
  { find: 'react-router', replacement: path.resolve(__dirname, 'node_modules', 'react-router') },
  // Use a lightweight i18n shim for tests to avoid full initialization side-effects
  { find: /.*\/i18n(\.js)?$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'i18n.js') },
  // Map any direct import of the app i18n initializer to the test shim so
  // tests don't execute the full i18next initialization which can cause
  // re-import cycles or environment-specific behavior in the Vitest runner.
  { find: /^frontend\/src\/i18n(\.js)?$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'i18n.js') },
  { find: /^\.\/i18n(\.js)?$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'i18n.js') },
  // Ensure any import that directly references the websocket service path in
  // tests resolves to our test-shim which mirrors the mocked API used in
  // setupTests. This prevents Vite from failing to resolve relative paths
  // inside test files that refer to ../services/websocket.service.
  { find: /.*services\/websocket\.service$/, replacement: path.resolve(__dirname, 'frontend', 'src', 'test-shims', 'websocket.service.js') },
  // Ensure testing-library is deduped to root so setupFiles and tests share the
  // same module instances (important for cleanup/render overrides).
  { find: '@testing-library/react', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'react') },
  { find: '@testing-library/dom', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'dom') },
  { find: '@testing-library/user-event', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'user-event') },
  { find: '@testing-library/jest-dom', replacement: path.resolve(__dirname, 'node_modules', '@testing-library', 'jest-dom') },
    ]
  }
});
