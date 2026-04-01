import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
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
      '/api': {
        target: 'http://your-v2board-backend.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
  build: {
    // Small bundle size, no source maps in production
    sourcemap: false,
    rollupOptions: {
      output: {
        // Randomized chunk names to avoid fingerprinting
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
  },
})
