// vitest.components.config.js (normalized for stable test runs)
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Keep plugins empty for test runs to avoid plugin preamble detection.
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    // Use transformMode (web) so Vitest treats JSX files as web modules
    // during worker import analysis.
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    deps: {
      inline: ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-i18next']
    },
    setupFiles: [path.resolve(__dirname, 'frontend', 'src', 'setupTests.js')],
    include: [
      '**/tests/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'frontend/src/**/*.test.{js,jsx,ts,tsx}',
      'frontend/src/**/*.spec.{js,jsx,ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.js', 'src/test-utils.js']
    }
  },
  resolve: {
    conditions: ['development', 'browser', 'node'],
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router', 'react-router-dom'],
    alias: [
      { find: 'react', replacement: path.resolve(__dirname, 'node_modules', 'react', 'index.js') },
      { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'index.js') },
      { find: /^react(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react') + '$1' },
      { find: /^react-dom(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-dom') + '$1' },
      { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, 'node_modules', 'react-dom', 'client.js') },
      { find: /^react-i18next(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-i18next') + '$1' },
      { find: /^react-router(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-router') + '$1' },
      { find: /^react-router-dom(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'react-router-dom') + '$1' },
      { find: /^\.\.\/components\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'components') + '/$1' },
      { find: /^\.\.\/components\/common\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'components', 'common') + '/$1' },
      { find: /^\.\.\/contexts\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src', 'contexts') + '/$1' },
      { find: /^msw(\/.*)?$/, replacement: path.resolve(__dirname, 'node_modules', 'msw') + '$1' },
      { find: /^\.\.\/\.\.\/frontend\/src\/(.*)/, replacement: path.resolve(__dirname, 'frontend', 'src') + '/$1' }
    ]
  }
});