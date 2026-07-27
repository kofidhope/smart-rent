import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Every call to /api goes to your gateway
      // You never hardcode localhost:8882 in components
      // Change target if your gateway is on a different port
      '/api': {
        target: 'http://localhost:8882',
        changeOrigin: true,
      },
    },
  },
})