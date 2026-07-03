import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['tree'],
    exclude: ['./dist', 'node_modules'],
    setupFiles: ['./tests/setup.ts'],
  },
})
