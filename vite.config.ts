import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base нужен только для GitHub Pages; локальная разработка остаётся на корне
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bubkaPlate/' : '/',
  plugins: [react()],
}))
