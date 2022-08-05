/// <reference types="Cypress" />

// Change admin to regular user when feature is ready for general use

describe('Faculty overview', () => {
  describe('Faculty can be selected', () => {
    it('Faculties are listed and one can be chosen', () => {
      cy.init('/faculties', 'admin')
      cy.get('[data-cy=select-faculty]').contains('td', 'H10')
      cy.contains('td', 'H99').should('not.exist')
      cy.contains('td', 'H90').click()
      cy.contains('.header', 'Eläinlääketieteellinen tiedekunta')
    })
  })

  describe('Faculty basic information', () => {
    beforeEach(() => {
      cy.init('/faculties', 'admin')
      cy.contains('td', 'H90').click()
    })
    it('Credits produced by faculty are shown', () => {
      cy.get(['data-cy=Section-CreditsProducedByTheFaculty'])
      cy.get(['data-cy=Graph-CreditsProducedByTheFaculty'])
    })
  })

  describe('Study programme information', () => {
    beforeEach(() => {
      cy.init('/faculties', 'admin')
      cy.contains('td', 'H90').click()
    })

    it('Study programme credit information is not visible in the beginning', () => {
      cy.get('table[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
    })

    it('Study programme credit information can be toggled', () => {
      cy.get('table[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('button[data-cy="Button-CreditsProducedByTheFaculty-0"]').click()
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
      cy.get('button[data-cy="Button-CreditsProducedByTheFaculty-3"]').click()
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
      cy.get('button[data-cy="Button-CreditsProducedByTheFaculty-0"]').click()
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('td[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
    })
  })
})
