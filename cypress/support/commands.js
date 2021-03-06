/// <reference types="Cypress" />

/**
 * Initialize headers and load the base URL or optional path.
 */
Cypress.Commands.add('init', (path = '') => {
  cy.server({
    onAnyRequest: function (route, proxy) {
      proxy.xhr.setRequestHeader('uid', 'tktl')
      proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
      proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
      proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
    },
  })

  // Babel throws an error probably because of markdown files. I'm sorry about this :lul:.
  cy.on('uncaught:exception', (err, runnable) => {
    expect(err.message).to.include("Cannot read property 'helpers' of undefined")
    done()
    return false
  })

  const baseUrl = Cypress.config().baseUrl
  cy.visit(baseUrl.concat(path))
})

/**
 * Shorthand for using "Cypress Selectors" (CS), i.e., `data-cy` attributes.
 */
Cypress.Commands.add('cs', name => {
  return cy.get(`[data-cy='${name}']`)
})

/**
 * Select item specified by `index` number from a semantic-ui dropdown with
 * `data-cy` attribute value `name`.
 */
Cypress.Commands.add('selectFromDropdown', (name, index) => {
  const indexes = Array.isArray(index) ? index : [index]

  indexes.forEach(i => {
    cy.cs(name).click().children('.menu').children().eq(i).click({ force: true })
  })

  // Close multiple selection so it does not block elements underneath it.
  if (Array.isArray(index)) {
    cy.cs(name).children('.icon').click({ force: true })
  }
})

/**
 * Move to page with studyProgramme population
 */
Cypress.Commands.add('selectStudyProgramme', name => {
  cy.cs('navbar-studyProgramme').click()
  cy.cs('navbar-class').click()
  cy.cs('select-study-programme').click().children().contains(name).click()
  cy.contains('See population').click()
})
