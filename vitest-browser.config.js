// Basic Vitest configuration file for VS Code Extension debugging
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom to simulate a browser environment
    globals: true, // Allow global functions like describe, it, expect
    deps: {
      inline: ['react', 'react-dom'] // Inline important dependencies
    },
    setupFiles: ['./src/setupTests.minimal.js'], // Our minimal setup file without dependencies
  },
});