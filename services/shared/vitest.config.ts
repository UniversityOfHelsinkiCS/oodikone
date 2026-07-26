import { defineConfig } from 'vitest/config'

// oxlint-disable-next-line no-default-export
export default defineConfig({
  test: {
    reporters: ['tree'],
    exclude: ['./dist', 'node_modules'],
    pool: 'threads',
    testTimeout: 10_000, // 10s timeout
    sequence: {
      concurrent: true, // Enable parallel tests by default
    },
  },
})
