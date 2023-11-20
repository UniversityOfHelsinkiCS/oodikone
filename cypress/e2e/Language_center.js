/// <reference types="Cypress" />

const hasLanded = () => {
  cy.contains('This view displays amounts')
  cy.contains('Show number of')
}

describe('When language center is opened', () => {
  describe('with an admin user', () => {
    beforeEach(() => {
      cy.init('/languagecenterview', 'admin')
      cy.get('[data-cy="completions-button"]').click()
      cy.get('[data-cy="semester-from"]').click()
      cy.contains('Syksy 2017').click()
      cy.get('[data-cy="semester-to"]').click()
    })

    it('Initial view is correct', () => {
      hasLanded()
      cy.contains('All courses total')
      cy.contains('Academic and Professional')
      cy.contains('AYKK-RUKIRJ')
    })

    it('Faculties tab shows numbers', () => {
      cy.contains('All courses total')
      cy.contains('1339')
      cy.contains('832')
      cy.contains('505')
    })

    it('Faculties tab ratio button works', () => {
      cy.get('[data-cy="ratio-button"]').click()
      cy.contains('0')
      cy.contains('Total ratio')
    })

    it('Faculties tab semester selector changes numbers', () => {
      cy.get('[data-cy="semester-from"]').click()
      cy.contains('Syksy 2020').click()
      cy.contains('1339').should('not.exist')
      cy.contains('3')
      cy.contains('1')
      cy.contains('4')
      cy.contains('All courses total')
    })

    it('Semester tab opens and contains coloring filter', () => {
      cy.contains('By semesters').click()
      cy.contains('50')
      cy.contains('191')
      cy.contains('210')
      cy.contains('308')
      cy.contains('1339')
      cy.contains('Coloring mode')
    })
  })
  describe('with a user with no rights', () => {
    it('"Access denied" is shown', () => {
      cy.init('/languagecenterview', 'norights')
      cy.contains('Access denied')
      cy.contains("You're currently not allowed to see this page.")
      cy.contains('Custom populations').click()
      cy.contains('Language center view').should('not.exist')
    })
  })
})
