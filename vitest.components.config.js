// vitest.components.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Do not set `root` here; letting Vite keep the repo root prevents
  // esbuild from attempting to resolve the config file inside the frontend
  // directory. Aliases below use absolute paths to the frontend/src folder.
  // For tests we avoid @vitejs/plugin-react (it performs preamble detection that
  // sometimes fails in our test environment). Rely on esbuild for JSX transform
  // which is sufficient for Vitest runs.
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    // Ensure test files and imported modules with JSX are transformed during
    // import analysis so tests can import .jsx implementations directly.
    testTransformMode: {
      web: ['**/*.{js,jsx,ts,tsx}']
    },
    // Inline core runtime deps so Vitest bundles and executes them in the
    // same worker process. This helps avoid duplicate copies being loaded
    // from nested node_modules during test runs.
    deps: {
      inline: ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-i18next']
    },
  // Point test setup directly to frontend's setup file so root-level
  // test runs pick up the intended shims (MSW, RTL matchers, mocks).
  // Use an absolute path to the frontend setup file so Vitest's resolver
  // cannot accidentally rewrite or double-prefix the relative path when
  // invoked from the repository root. This ensures worker processes load
  // the exact file we intend.
  setupFiles: [path.resolve(__dirname, 'frontend', 'src', 'setupTests.js')], // Use the frontend setup file
    // Allow running the full components folder but also individual test
    // files anywhere under `tests/` to make single-file runs convenient for
    // rapid iteration. Keep the more-specific pattern for compatibility.
    include: [
      '**/tests/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      // Also include frontend/src tests so repo-level runs pick up the
      // component tests living under frontend/src.
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
    // Include 'node' so packages that provide conditional exports (like msw)
    // with a './node' entry can be resolved during test import-analysis.
    conditions: ['development', 'browser', 'node'],
    // Ensure React, React Router and related runtimes are resolved to a single
    // copy to avoid invalid hook calls caused by duplicate instances.
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      'react-router-dom'
    ],
    // Map legacy test relative imports like "../components/X" and "../contexts/Y"
    // to the frontend source tree so Vite can resolve modules correctly.
    alias: [
      // direct mappings to each package entry ensure the resolver returns
      // the same file for 'react' and 'react-dom' imports (prevents
      // sub-dependency resolution from pulling a different copy).
  { find: 'react', replacement: path.resolve(__dirname, 'node_modules', 'react', 'index.js') },
  { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'index.js') },
      // Force resolution of react/react-dom/react-router and their subpaths to
      // the workspace root node_modules. Some imports (or nested packages)
      // reference internal subpaths (for example, 'react-dom/client' or
      // 'react-router/lib/hooks') which won't match a plain string alias. Use
      // regex aliases to catch those and ensure Vitest uses a single copy of
      // these libraries during tests to avoid invalid hook calls.
  // Prefer the frontend/ package copies to match the component source tree.
  { find: /^react(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react') + '$1' },
  { find: /^react-dom(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-dom') + '$1' },
  // Ensure deep imports like 'react-dom/client' resolve to the react-dom package
  { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'client.js') },
  { find: /^react-i18next(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-i18next') + '$1' },
  { find: /^react-router(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-router') + '$1' },
  { find: /^react-router-dom(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-router-dom') + '$1' },
      // Map legacy relative imports to the frontend source. Append '/$1' so
      // the regex capture group is preserved when replaced with an absolute
      // path.
       { find: /^\.\.\/components\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'components') + '/$1' },
       { find: /^\.\.\/components\/common\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'components', 'common') + '/$1' },
       { find: /^\.\.\/contexts\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'contexts') + '/$1' },
      // Allow msw deep-imports such as 'msw/node' to resolve to the package
      // root so Vite's import-analysis can follow conditions. Adding this
      // regex ensures deep msw imports are resolved from node_modules/msw.
      { find: /^msw(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'msw') + '$1' },
          // Handle legacy test shims that import from '../../frontend/src/...'
       { find: /^\.\.\/\.\.\/frontend\/src\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src') + '/$1' },
    ]
  }
});