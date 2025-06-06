import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // เปลี่ยนให้ชี้ไปที่ backend ของคุณ
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
