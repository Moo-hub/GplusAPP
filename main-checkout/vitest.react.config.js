// vitest.react.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';

const root = process.cwd();

export default defineConfig({
  root,
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
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