import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      'react-i18next': require('path').resolve(__dirname, 'node_modules', 'react-i18next', 'index.js')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'G+ Recycling App',
        short_name: 'G+',
        theme_color: '#ffffff',
      }
    })
  ],
  server: {
    port: 3007,
    host: true,
    strictPort: false,
    proxy: {
    // Ensure React is injected into modules that rely on the classic JSX
    // runtime (tests that use JSX without importing React). This uses
    // esbuild's `jsxInject` option so tests processed by Vitest/Vite
    // receive `import React from 'react'` automatically.
    esbuild: {
      jsxInject: "import React from 'react'"
    },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // set headers for proxied requests to ensure backend sees the
          // original host and accepts CORS preflight from dev server
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://localhost:3007');
          });
        }
      }
    },
    cors: {
      origin: true,
      methods: ['GET','POST','PUT','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token']
    }
  }
});