import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // This project has React components with JSX in `.js` files. Vite 8 only
  // transforms `.jsx` by default, so include source `.js` files explicitly.
  oxc: {
    include: /src\/.*\.[jt]sx?$/,
  },
});
