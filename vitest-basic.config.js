// Basic Vitest configuration file to debug VS Code extension issues
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});