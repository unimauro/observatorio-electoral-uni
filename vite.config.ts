
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages sirve el sitio en /<repo>/. Se puede sobrescribir con BASE_PATH (p. ej. "/" para dominio propio).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/observatorio-electoral-uni/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
})
