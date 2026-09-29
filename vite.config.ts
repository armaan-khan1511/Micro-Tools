import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdf-lib')) {
            return 'vendor-pdflib'
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdfjs'
          }
          if (id.includes('node_modules/jszip')) {
            return 'vendor-jszip'
          }
          if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) {
            return 'vendor-markdown'
          }
          if (id.includes('node_modules/html5-qrcode')) {
            return 'vendor-qrscan'
          }
          if (id.includes('node_modules/qrcode')) {
            return 'vendor-qrgen'
          }
          if (id.includes('node_modules/diff')) {
            return 'vendor-diff'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
})
