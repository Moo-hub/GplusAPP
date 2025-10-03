const path = require('path');

module.exports = {
  // Use the frontend folder as root so setupFiles resolve relative to frontend/src
  root: __dirname,
  // Force resolution of react/react-dom to frontend/node_modules to avoid
  // mixed React copies when the repository root also contains node_modules.
  resolve: {
    // Point aliases to the workspace root node_modules so hoisted packages
    // (react/react-dom) are used when using npm workspaces. This avoids
    // trying to resolve a copy inside frontend/node_modules which will be
    // absent after hoisting.
    alias: {
      react: path.resolve(__dirname, '..', 'node_modules', 'react'),
      'react-dom': path.resolve(__dirname, '..', 'node_modules', 'react-dom')
    }
  },
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'src/**/*.spec.{js,jsx,ts,tsx}'
    ],
    setupFiles: [path.resolve(__dirname, 'src', 'setupTests.js')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage'
    }
  }
};
