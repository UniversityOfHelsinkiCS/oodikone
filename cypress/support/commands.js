/// <reference types="Cypress" />
//
// Note: here we need to set keys to be all lowercase, since
// we're replacing headers after they've left browser / frontend.
// This cypress user is used just for login and modifying users. Tests themselves should
// be ran by mocking users.
const cypressUserHeaders = {
  uid: 'cypress',
  displayname: 'Cypress User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
  edupersonaffiliation: 'member;employee;faculty',
  mail: 'grp-toska+mockcypressuser@helsinki.fi',
}

/**
 Set up headers and load the base URL or optional path.
 */
Cypress.Commands.add('init', (path = '') => {
  cy.intercept('', req => {
    req.headers = cypressUserHeaders
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
