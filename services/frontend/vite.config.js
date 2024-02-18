/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default defineConfig({
  plugins: [react(), tsconfigPaths({ root: __dirname, projects: ['./jsconfig.json'] })],
  server: {
    proxy: {
      '/api/': {
        target: 'http://backend:8080',
      },
    },
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap: 'hidden',
  },
})
