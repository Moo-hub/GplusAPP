/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Use the canonical frontend TypeScript bootstrap so all workers load
    // the same shims (jest-dom, localStorage, CSRF meta) regardless of
    // whether the config is loaded from the repo root or a nested folder.
    setupFiles: [require('path').resolve(__dirname, 'frontend', 'src', 'setupTests.ts')],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    // إضافة دعم لملفات JSON في الاختبارات
    deps: {
      inline: ['**/locales/*.json']
    },
    // تحسين التوازي لتسريع الاختبارات
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // منع تداخل التسجيلات عند تشغيل اختبارات i18n
      }
    }
  },
  // تمكين استيراد ملفات JSON
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  }
});