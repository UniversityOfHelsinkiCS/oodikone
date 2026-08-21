import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    reporters: ['tree'],
    exclude: ['./dist', 'node_modules'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'threads',
    testTimeout: 10_000, // 10s timeout
    sequence: {
      concurrent: true, // Enable parallel tests by default
    },
  },
})
