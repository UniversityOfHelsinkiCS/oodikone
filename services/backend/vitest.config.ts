import { defineConfig } from 'vitest/config'

export default defineConfig({
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
