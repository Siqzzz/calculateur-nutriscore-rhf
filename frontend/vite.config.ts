import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // En dev, /api est proxifié vers Nginx qui redirige vers Symfony
    proxy: {
      '/api': {
        target: 'http://nginx',
        changeOrigin: true,
      },
    },
  },
})
