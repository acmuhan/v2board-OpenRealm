import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/theme/openrealm/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    // Anti-detection: proxy all API requests, no v2board paths exposed
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
