import React from 'react';
/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// الإعلان عن أن هذا العامل يأخذ السيطرة فورًا
clientsClaim();

// التخزين المؤقت المسبق لجميع الأصول التي تم إنتاجها بواسطة هذا المشروع
// (معظم هذا يتم تكوينه تلقائيًا بواسطة أداة البناء)
precacheAndRoute(self.__WB_MANIFEST);

// تعامل مع التنقل للمسارات المتعددة باستخدام خدمة الملف الثابت index.html
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // العودة false فقط للمسارات التي تبدأ بـ /
  ({ request, url }) => {
    // اطلب URL شكل أساسي؟
    if (request.mode !== 'navigate') {
      return false;
    }

    // إذا كان هذا طلب ملف ثابت (مثل CSS أو صورة)، استخدم استراتيجية مختلفة
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }

    // العودة true للتعامل مع طلب التنقل باستخدام index.html
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// التعامل مع استراتيجية تخزين مؤقت للصور
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 أيام
      }),
    ],
  })
);

// التعامل مع استراتيجية تخزين مؤقت لطلبات API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 12 * 60 * 60, // 12 ساعة
      }),
    ],
  })
);

// التعامل مع CSS و JS باستخدام استراتيجية StaleWhileRevalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// الاستماع لحدث تثبيت service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// معالجة رسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});