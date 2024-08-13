import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      'buffer': 'buffer',
      'strophe.js': path.resolve(__dirname, 'node_modules/strophe.js'),
    },
  },
  
})

