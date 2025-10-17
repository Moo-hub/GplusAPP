import { defineConfig } from "vitest/config";
import path from 'path';
import react from '@vitejs/plugin-react';

// Use the current working directory (the frontend folder when running
// tests from the frontend package) as the frontend root. Avoid adding
// 'frontend' again which can produce a duplicated path like
// .../frontend/frontend in some shells.
const frontendRoot = path.resolve(process.cwd());

export default defineConfig({
  // Ensure Vite's root for this config is the frontend folder so
  // setupFiles and relative imports resolve to frontend/src instead
  // of the repository root.
  root: frontendRoot,
  // Use @vitejs/plugin-react during test runs to enable the automatic
  // JSX runtime (React 17+ transform) so tests don't need to import
  // React in every file. This addresses the CI error "React is not defined".
  plugins: [
    react({ jsxRuntime: 'automatic' })
  ],
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
  setupFiles: [path.resolve(frontendRoot, 'src', 'setupTests.js')],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});