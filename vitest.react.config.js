// vitest.react.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';

// Test-focused config: avoid enabling the full React plugin during
// unit tests (which can try to detect preambles in non-JSX files).
const root = process.cwd();

export default defineConfig({
  root,
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    // Use the minimal setup file for quick tests; resolve to absolute
    // path to avoid ambiguity when running from different CWDs.
    setupFiles: [path.resolve(root, 'src', 'setupTests.minimal.js')],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    conditions: ['development', 'browser']
  }
});