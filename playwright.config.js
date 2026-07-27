const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './playwright',
  testMatch: ['**/*.js'],
  testIgnore: ['**/support/**', '**/plugins/**'],
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1920, height: 1080 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
})
