/* eslint-disable import-x/no-extraneous-dependencies  */
/* eslint-disable import-x/no-default-export */

import { defineConfig } from 'cypress'

import coverage from '@cypress/code-coverage/task'
import plugin from './cypress/plugins/index.js'

export default defineConfig({
  experimentalStudio: process.env.NODE_ENV === 'development',
  projectId: 'c3jsph',
  defaultCommandTimeout: 30000,
  requestTimeout: 30000,
  videoCompression: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      coverage(on, config)
      plugin(on, config)
      return config
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
  video: true,
})
