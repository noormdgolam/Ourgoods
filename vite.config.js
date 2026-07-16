import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [react()],
  build: {
    outDir: '../',
    emptyOutDir: false,
  },
  server: {
    host: true,
    watch: {
      ignored: ['**/extracted_all/**']
    }
  }
})
