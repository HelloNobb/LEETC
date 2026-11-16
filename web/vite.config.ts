import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the repo at /LEETC/.
  base: '/LEETC/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LEETC',
        short_name: 'LEETC',
        start_url: '/LEETC/',
        scope: '/LEETC/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111318',
        theme_color: '#111318',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Problem data and code live in IndexedDB; the SW only covers the app shell, list file, and problem images.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'problem-list', networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: /^https:\/\/assets\.leetcode\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'problem-images', expiration: { maxEntries: 300 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
});
