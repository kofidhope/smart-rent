import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to gateway during development
      // so you never hardcode the gateway URL in components
      '/api': {
        target: 'http://localhost:8882',
        changeOrigin: true,
      },
    },
  },
})