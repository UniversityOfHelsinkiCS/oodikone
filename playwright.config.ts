import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/support/**', '**/plugins/**'],

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [['list', { printFailuresInline: true }]],

  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,

  use: {
    baseURL: process.env.CI ? 'http://localhost:1337' : process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1920, height: 1080 },
    trace: 'on-first-retry',
    testIdAttribute: 'data-cy',
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
})
