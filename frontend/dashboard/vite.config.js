import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalized = id.replace(/\\/g, '/');

            if (
              normalized.includes('/three/') ||
              normalized.includes('/@react-three/') ||
              normalized.includes('/three-stdlib/')
            ) {
              return 'vendor-three';
            }
            if (normalized.includes('/maplibre-gl/') || normalized.includes('/react-map-gl/')) {
              return 'vendor-map';
            }
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/zustand/') ||
              normalized.includes('/framer-motion/')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})



