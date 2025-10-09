// vitest.conf.js - A simple Vitest configuration
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**', 
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ]
  }
});