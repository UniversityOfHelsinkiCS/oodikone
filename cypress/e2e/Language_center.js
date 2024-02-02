/// <reference types="Cypress" />

const hasLanded = () => {
  cy.contains('This view displays amounts')
  cy.contains('Show number of')
}

/*
  TODO FIX
  These use dumb numbers, because actual_studyright update in db is not yet
  in anon data, and the faculties do not get resolved.
*/

describe('When language center is opened', { retries: 2 }, () => {
  describe('as an admin user', () => {
    beforeEach(() => {
      cy.init('/languagecenterview', 'admin')
      cy.get('[data-cy="completions-button"]').click()
      cy.get('[data-cy="semester-from"]').click()
      cy.contains('Syksy 2017').click()
      cy.get('[data-cy="semester-to"]').click()
      hasLanded()
    })

    it('Initial view is correct', () => {
      cy.contains('All courses total')
      cy.contains('Academic and Professional')
      cy.contains('AYKK-RUKIRJ')
    })

    it('Faculties tab shows numbers', () => {
      cy.contains('All courses total')
      cy.contains('1363')
    })

    it('Faculties tab "exceeding" button works', () => {
      cy.get('[data-cy="difference-button"]').click()
      cy.contains('0')
      cy.contains('Total')
      cy.contains('1363').should('not.exist')
    })

    it('Faculties tab semester selector changes numbers', () => {
      cy.get('[data-cy="semester-from"]').click()
      cy.contains('Syksy 2020').click()
      cy.contains('1363').should('not.exist')
      cy.contains('All courses total')
    })

    it('Semester tab opens and contains coloring filter', () => {
      cy.contains('By semesters').click()
      cy.contains('1363')
      cy.contains('Coloring mode')
    })
  })
  describe('with a user with no rights', () => {
    it('"Access denied" is shown', () => {
      cy.init('/languagecenterview', 'norights')
      cy.contains('Access denied')
      cy.contains("You're currently not allowed to see this page.")
      cy.contains('Special populations').click()
      cy.contains('Language center view').should('not.exist')
    })
  })
})
