// vitest.components.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';

const root = process.cwd();

export default defineConfig({
  root,
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    // Resolve setup file absolutely to avoid CWD ambiguity in worker processes
    setupFiles: [path.resolve(root, 'src', 'setupTests.js')],
    include: ['**/tests/components/**/*.{test,spec}.{js,jsx,ts,tsx}'],
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
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        'src/test-utils.js',
      ]
    }
  },
  resolve: {
    conditions: ['development', 'browser']
  }
});