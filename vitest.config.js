/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
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
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ]
  }
});