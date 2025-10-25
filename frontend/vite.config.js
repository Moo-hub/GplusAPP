import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      // Ensure all imports of `msw` resolve to the single project copy
      // so handlers and the node server share the same implementation.
      msw: require('path').resolve(__dirname, 'node_modules', 'msw'),
      // Use a local lightweight shim for react-i18next during tests so
      // Vite's import-analysis doesn't fail in worktrees that lack the
      // dependency. Tests can still `vi.mock('react-i18next')` for
      // per-suite translations.
      'react-i18next': require('path').resolve(__dirname, 'node_modules', 'react-i18next', 'index.js')
    },
  },
  plugins: [
    // react({
    //   include: '**/*.{jsx,js}',
    // }),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'G+ Recycling App',
    //     short_name: 'G+',
    //     description: 'G+ recycling and rewards application',
    //     theme_color: '#ffffff',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   }
    // })
  ],
  server: {
    port: 3007,
    host: '0.0.0.0', // Enable network access for mobile testing
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      }
    }
  }
});
