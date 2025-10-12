/// <reference types="vitest" />
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