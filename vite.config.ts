import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/theme/openrealm/' : '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
        navigateFallback: '/theme/openrealm/index.html',
      },
      manifest: {
        name: 'OpenRealm',
        short_name: 'OpenRealm',
        description: 'OpenRealm VPN Dashboard',
        theme_color: '#070c18',
        background_color: '#070c18',
        display: 'standalone',
        start_url: '/theme/openrealm/',
        icons: [
          { src: '/theme/openrealm/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/theme/openrealm/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'http://your-v2board-backend.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/app.css'
          return 'assets/[hash].[ext]'
        },
        manualChunks(id) {
          if (id.includes('/node_modules/vue/') || id.includes('/node_modules/vue-router/') ||
              id.includes('/node_modules/pinia/') || id.includes('/node_modules/axios/')) {
            return 'vendor'
          }
          if (id.includes('/views/admin/') || id.includes('/components/layout/Admin')) {
            return 'admin'
          }
        },
      },
    },
  },
}))
