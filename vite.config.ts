import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
            if (id.includes('react/')) return 'vendor-react'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux'
            if (id.includes('recharts')) return 'vendor-charts'
            if (id.includes('react-icons')) return 'vendor-icons'
            if (id.includes('jspdf')) return 'vendor-pdf'
            if (id.includes('html2canvas')) return 'vendor-canvas'
          }
        }
      }
    }
  }
})