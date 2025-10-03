import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/components/__tests__/a11y-forms.test.jsx'],
    setupFiles: [],
    transformMode: { web: [/\.[jt]sx?$/] }
  }
});
