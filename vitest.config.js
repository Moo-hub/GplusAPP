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
      'react-i18next': path.resolve(__dirname, 'node_modules', 'react-i18next', 'index.js'),
      'src': path.resolve(__dirname, 'frontend/src'),
      'src/test-utils.js': path.resolve(__dirname, 'frontend/src/test-utils.js'),
      '@': path.resolve(__dirname, 'frontend/src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  setupFiles: ['./frontend/src/setupTests.js'],
    threads: false,
    isolate: true,
    testTimeout: 10000,
    hookTimeout: 5000,
    clearMocks: true,
    include: ['frontend/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/temp-merge/**',
      '**/repo_clean/**',
      '**/main-checkout/**',
      '**/main-checkout-temp/**',
      '**/duplicate_backups/**',
      '**/worktree-md-fix/**',
      '**/logs/**',
      '**/cache/**',
      '**/reports/**',
      '**/scripts/**',
      '**/tools/**',
      '**/template/**',
      '**/templates/**',
      '**/tests/**',
      '**/temp_clone/**',
      'repo_clean/**',
      'temp-merge/**',
      'duplicate_backups/**',
        '**/__tests_old__/**',
    ],
  }
});
// تم حذف التصدير الثاني لتوحيد التصدير الافتراضي عبر defineConfig فقط