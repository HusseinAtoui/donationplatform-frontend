import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Anything starting with /api will go to your backend
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
