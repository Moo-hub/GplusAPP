import { defineConfig } from "vitest/config";
import path from 'path';
import react from '@vitejs/plugin-react';

// Use the current working directory (the frontend folder when running
// tests from the frontend package) as the frontend root. Avoid adding
// 'frontend' again which can produce a duplicated path like
// .../frontend/frontend in some shells.
const frontendRoot = path.resolve(process.cwd());

// Export a function config so we can tweak behavior for 'test' mode.
// Important: @vitejs/plugin-react injects a preamble for fast-refresh
// which can confuse Vitest's transform step and surface the
// "can't detect preamble" errors. During test runs we prefer to let
// esbuild perform the JSX automatic transform and avoid react-refresh.
export default defineConfig(({ mode }) => ({
  root: frontendRoot,
  // Only enable the plugin in non-test modes. When running under
  // `mode === 'test'` Vitest will use esbuild for JSX transform.
  plugins: mode === 'test' ? undefined : [
    // Keep fastRefresh disabled so local dev doesn't rely on the
    // preamble injection that breaks in some headless worker setups.
    react({ jsxRuntime: 'automatic', fastRefresh: false })
  ],
  // Force esbuild to use automatic JSX transform in all modes so Vitest
  // can rely on esbuild instead of plugin preambles during tests.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  // Provide some resolve aliases for lightweight test shims. Vite's
  // import analysis runs before Vitest setupFiles, so missing optional
  // dev-only packages (React Query Devtools, react-redux in some tests,
  // and deep imports like react-icons/bs) can cause the run to fail early.
  // Map those package names to small stub modules under src/test-shims.
  resolve: {
    alias: {
      '@tanstack/react-query-devtools': path.resolve(frontendRoot, 'src', 'test-shims', 'react-query-devtools.js'),
      'react-redux': path.resolve(frontendRoot, 'src', 'test-shims', 'react-redux.js'),
      'react-icons/bs': path.resolve(frontendRoot, 'src', 'test-shims', 'react-icons-bs.js'),
      // Ensure react-i18next resolves even if not installed in test env
      'react-i18next': path.resolve(frontendRoot, 'src', 'test-shims', 'i18n.js'),
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    // Increase default timeouts to reduce birpc/test worker flakes in CI
    // and provide a little breathing room for slower machines. Bump to
    // 60s to avoid IPC/snapshot timeouts on slower CI runners.
    testTimeout: 60000,
    hookTimeout: 60000,
    // Pool options to increase worker/threads timeouts for birpc/ipc stability
    poolOptions: {
      threads: {
        timeout: 60000
      }
    },
    // Ensure the React plugin runs for test files and JSX is transformed
    // during Vitest import analysis. transformMode tells Vite to treat
    // these files as web modules for the test environment.
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    // Explicitly include frontend test patterns so Vitest discovers and
    // transforms .jsx/.tsx test files correctly.
    include: [
      "src/**/*.test.{js,jsx,ts,tsx}",
      "src/**/*.spec.{js,jsx,ts,tsx}"
    ],
    // Use an absolute path to avoid ambiguity when Vitest workers are
    // launched from different CWDs. This ensures the same file is loaded
    // across all worker processes.
    setupFiles: [
      // Load the repository root vitest setup to install global shims/mocks
      path.resolve(frontendRoot, '..', 'vitest.setup.js'),
      // Load the frontend-specific setup for additional shims
      path.resolve(frontendRoot, 'src', 'setupTests.js')
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
}));