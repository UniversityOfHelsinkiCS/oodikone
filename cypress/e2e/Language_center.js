/// <reference types="cypress" />

const chooseSemester = (semester, fromOrTo) => {
  cy.cs(`semester-${fromOrTo}`).click()
  cy.cs(`select-opt-${semester}`).click()
  cy.cs(`select-opt-${semester}`).should('not.have.class', 'visible')
}

const checkNumbers = (numbers, numberOfColumns, mode) => {
  const offset = 1 // skip first col with codes / names
  cy.cs(`ooditable-${mode}`).find('table').find('tbody').as('tbody')
  cy.get('@tbody').find('tr').first().as('totalRow')
  cy.get('@totalRow').find('td').should('have.length', numberOfColumns)
  cy.get('@totalRow').find('td').eq(0).should('contain', 'All courses total')

  numbers.forEach((number, index) => {
    cy.get('@totalRow')
      .find('td')
      .eq(index + offset)
      .should('contain', number)
  })
}

describe('When language center is opened', () => {
  describe('as an admin user', () => {
    beforeEach(() => {
      cy.init('/languagecenterview', 'admin')
      cy.cs('completions-button').click()
    })

    describe('Faculties tab', () => {
      beforeEach(() => {
        chooseSemester('Syksy 2017', 'from')
        chooseSemester('Kevät 2024', 'to')
      })

      it('Initial view is correct', () => {
        cy.contains('All courses total')
        cy.contains('Academic and Professional')
        cy.contains('AYKK-RUKIRJ')
      })

      it('Faculties tab shows numbers', () => {
        cy.get('table > tbody > tr:first').within(() => {
          cy.get('td').should('have.length', 15)
          cy.get('td').eq(0).contains('All courses total')
          const numbers = [2076, 36, 9, 33, 756, 15, 40, 6, 48, 1, 24, 1059, 49, 0]
          numbers.forEach((number, index) => {
            cy.get('td')
              .eq(index + 1)
              .contains(number)
          })
        })
      })

      it('Faculties tab "exceeding" button works', () => {
        cy.cs('difference-button').click()
        checkNumbers([65, 2, 0, 3, 13, 0, 1, 1, 2, 0, 1, 30, 11, 1], 15, 'faculties')
      })

      it('Faculties tab semester selector changes numbers', () => {
        chooseSemester('Syksy 2020', 'from')
        checkNumbers([1184, 28, 6, 27, 496, 4, 10, 2, 33, 0, 9, 535, 34, 0], 15, 'faculties')
      })
    })

    describe('Semester tab', () => {
      beforeEach(() => {
        cy.contains('By semesters').click()
        chooseSemester('Syksy 2017', 'from')
        chooseSemester('Kevät 2024', 'to')
      })

      it('Semester tab shows numbers', () => {
        checkNumbers([2076, 69, 26, 298, 58, 343, 98, 438, 138, 310, 90, 123, 74, 10, 1], 16, 'semesters')
      })
    })
  })

  describe('with a user with no rights', () => {
    it('"Access denied" is shown', () => {
      cy.init('/languagecenterview', 'norights')
      cy.contains('Access denied')
      cy.contains("You don't currently have permission to view this page.")
      cy.contains('Special populations').click()
      cy.contains('Language center view').should('not.exist')
    })
  })
})
