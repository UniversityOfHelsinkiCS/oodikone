/* eslint-disable import/no-extraneous-dependencies */
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

import { inStaging } from './src/conf'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default defineConfig({
  plugins: [react()],
  base: inStaging ? '/oodikone' : '/',
  server: {
    proxy: {
      '/api/': {
        target: 'http://backend:8080',
      },
    },
    host: true,
    port: 3000,
  },
  preview: {
    proxy: {
      '/api/': {
        target: 'http://localhost:8080',
      },
    },
    port: 4173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: 'hidden',
  },
  define: {
    'process.env': process.env,
  },
})
