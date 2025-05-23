// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// eslint-disable-next-line import/no-extraneous-dependencies
require('@cypress/code-coverage/support')
require('./commands')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Cypress.on('uncaught:exception', error => {
  /* returning false here prevents Cypress from failing the test */
  return true
})
