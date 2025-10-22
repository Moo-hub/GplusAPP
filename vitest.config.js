/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// Compute absolute path to the repository's frontend folder so we can
// limit test discovery to the canonical frontend/src folder. This
// prevents stale copies elsewhere in the workspace from being picked up
// during test runs launched from the repository root.
const repoRoot = path.resolve(process.cwd());
const frontendRoot = path.resolve(repoRoot, 'frontend');

export default defineConfig({
  resolve: {
    alias: {
      'react-i18next': path.resolve(__dirname, 'node_modules', 'react-i18next', 'index.js')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
  // Run tests single-threaded and isolate each test environment for
  // determinism while stabilizing flaky tests.
  threads: false,
  isolate: true,
  testTimeout: 10000,
  hookTimeout: 5000,
  clearMocks: true,
  // Use an absolute glob to target only the canonical frontend tests.
  include: [path.join(frontendRoot, 'src', '**', '*.{test,spec}.{js,jsx,ts,tsx}')],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      // Exclude workspace backup/merge folders that contain stale copies
      // which interfere with test discovery and import resolution.
      '**/temp-merge/**',
      '**/repo_clean/**'
    ]
  }
});