/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Ensure a single copy of core libs during tests to avoid invalid hook calls
    // and duplicate module instances (React, react-dom, react-router, i18n).
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-i18next'],
    // During tests we alias heavy UI libs to small local mocks so Vite's
    // import-analysis doesn't attempt to resolve and transform the real
    // packages (which may not be necessary or available in the test env).
    alias: {
      antd: path.resolve(__dirname, 'tests/__mocks__/antd.js'),
      '@ant-design/icons': path.resolve(__dirname, 'tests/__mocks__/ant-design-icons.js'),
      recharts: path.resolve(__dirname, 'tests/__mocks__/recharts.js')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Ensure test files and imported modules with JSX are transformed
    // during import analysis so tests can import .jsx implementations.
    testTransformMode: {
      web: ['**/*.{js,jsx,ts,tsx}']
    },
  // Keep tests single-process where possible by running small batches.
  // Worker thread tuning is handled at runtime via environment variables
  // or CLI flags when necessary to avoid typing conflicts with Vitest types.
  setupFiles: ['./frontend/src/setupTests.js'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ]
  }
});