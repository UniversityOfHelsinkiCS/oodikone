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
})
