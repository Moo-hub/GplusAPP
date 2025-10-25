// vitest.react.config.js
import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.minimal.js'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    conditions: ['development', 'browser']
  }
});