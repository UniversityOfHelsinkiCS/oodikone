/// <reference types="Cypress" />

/**
 * Initialize headers and load the base URL or optional path.
 */
Cypress.Commands.add("init", (path = '') => {
  //cy.server({
  //  onAnyRequest: function (route, proxy) {
  //    proxy.xhr.setRequestHeader('uid', 'tktl')
  //    proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
  //    proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
  //    proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
  //  }
  //})

  //// Babel throws an error probably because of markdown files. I'm sorry about this :lul:.
  //cy.on('uncaught:exception', (err, runnable) => {
  //  expect(err.message).to.include("Cannot read property 'helpers' of undefined")
  //  done()
  //  return false
  //})

  //cy.visit(Cypress.config().baseUrl.concat(path))
  cy.visit(Cypress.config().baseUrl)
})

/**
 * Shorthand for using "Cypress Selectors" (CS), i.e., `data-cy` attributes.
 */
Cypress.Commands.add("cs", (name) => {
  return cy.get(`[data-cy='${name}']`)
})

/**
 * Select item specified by `index` number from a semantic-ui dropdown with
 * `data-cy` attribute value `name`.
 */
Cypress.Commands.add("selectFromDropdown", (name, index) => {
  const indexes = Array.isArray(index) ? index : [index]

  indexes.forEach((i) => {
    cy.cs(name).click().children(".menu").children().eq(i).click({ force: true })
  })

  // Close multiple selection so it does not block elements underneath it.
  if (Array.isArray(index)) {
    cy.cs(name).children(".icon").click({ force: true })
  }
})
