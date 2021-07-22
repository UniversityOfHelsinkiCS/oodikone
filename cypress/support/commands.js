/// <reference types="Cypress" />
//
// Note: here we need to set keys to be all lowercase, since
// we're replacing headers after they've left browser / frontend.
// All of these users are available in anon user-db
const adminUserHeaders = {
  uid: 'admin',
  displayname: 'Admin User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
  edupersonaffiliation: 'member;employee;faculty',
  mail: 'grp-toska+mockadminuser@helsinki.fi',
}

const basicUserHeaders = {
  uid: 'basic',
  displayname: 'Basic User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
  edupersonaffiliation: 'member',
  mail: 'grp-toska+mockbasicuser@helsinki.fi',
}

const onlycoursestatisticsUserHeaders = {
  uid: 'onlycoursestatistics',
  displayName: 'Onlycoursestatistics User',
  'shib-session-id': 'mock-session',
  hyGroupCn: 'grp-oodikone-basic-users',
  eduPersonAffiliation: 'member',
  mail: 'grp-toska+mockonlycoursestatisticsuser@helsinki.fi',
}

const norightsUserHeaders = {
  uid: 'norights',
  displayname: 'Norights User',
  'shib-session-id': 'mock-cypress-session',
  hygroupcn: 'grp-oodikone-users',
  edupersonaffiliation: 'member',
  mail: 'grp-toska+mocknorightuser@helsinki.fi',
}

const userHeaders = [adminUserHeaders, basicUserHeaders, onlycoursestatisticsUserHeaders, norightsUserHeaders]

/**
 Set up headers to login, set up correct user (admin / basic / etc.) and open given path.
 */
Cypress.Commands.add('init', (path = '', userId = 'basic') => {
  cy.intercept('', req => {
    const headersToUse = userHeaders.find(({ uid }) => uid === userId)
    console.log('jees', JSON.stringify(headersToUse))
    if (!headersToUse) return
    req.headers = headersToUse
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
