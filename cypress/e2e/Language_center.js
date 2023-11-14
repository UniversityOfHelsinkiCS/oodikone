/// <reference types="Cypress" />

const hasLanded = () => {
  cy.contains('This view displays amounts')
  cy.contains('Show number of')
}

describe('When language center is opened', () => {
  before(() => {
    cy.init('/languagecenterview')
    hasLanded()
    cy.contains('1339')
    cy.contains('832')
    cy.contains('505')
    cy.contains('All courses total')
    cy.contains('Academic and professional')
    cy.contains('AYKK-RUKIRJ')
  })
})
