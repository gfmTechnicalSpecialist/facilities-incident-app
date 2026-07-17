import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['momentum-logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Momentum Facilities Incident Hub',
        short_name: 'Incident Hub',
        description: 'Report, track, and review facilities incidents.',
        theme_color: '#000a5c',
        background_color: '#f4f7fb',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/gfmapi': {
        target: 'https://gfmincidentreportingapi-grgeh5edbvffagfs.northeurope-01.azurewebsites.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gfmapi/, ''),
      },
    },
  },
});
