/// <reference types="cypress" />

const hasLanded = () => {
  cy.contains('This view displays amounts')
  cy.contains('Show number of')
}

const chooseSemester = (semester, fromOrTo) => {
  cy.get(`[data-cy="semester-${fromOrTo}"]`)
    .click()
    .within(() => {
      cy.get('div.visible.menu.transition').within(() => {
        cy.contains('div.item', semester).click()
      })
      cy.get('div.menu.transition').should('not.have.class', 'visible')
    })
}

const checkNumbers = (numbers, numberOfColumns) => {
  cy.get('table > tbody > tr:first').within(() => {
    cy.get('td').should('have.length', numberOfColumns)
    cy.get('td').eq(0).contains('All courses total')
    numbers.forEach((number, index) => {
      cy.get('td')
        .eq(index + 1)
        .contains(number)
    })
  })
}

const checkStyle = (styles, numberOfColumns) => {
  cy.get('table > tbody > tr:first').within(() => {
    cy.get('td').should('have.length', numberOfColumns)
    styles.forEach((style, index) => {
      cy.get('td')
        .eq(index + 1)
        .should('have.attr', 'style')
        .and('include', style)
    })
  })
}

describe('When language center is opened', () => {
  describe('as an admin user', () => {
    beforeEach(() => {
      cy.init('/languagecenterview', 'admin')
      cy.get('[data-cy="completions-button"]').click()
      hasLanded()
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
          const numbers = [36, 9, 33, 751, 15, 40, 6, 49, 1, 24, 1059, 53, 0, 2076]
          numbers.forEach((number, index) => {
            cy.get('td')
              .eq(index + 1)
              .contains(number)
          })
        })
      })

      it('Faculties tab "exceeding" button works', () => {
        cy.get('[data-cy="difference-button"]').click()
        checkNumbers([...new Array(12).fill(0), 1, 219], 15)
      })

      it('Faculties tab semester selector changes numbers', () => {
        chooseSemester('Syksy 2020', 'from')
        checkNumbers([28, 6, 27, 491, 4, 10, 2, 34, 0, 9, 535, 38, 0, 1184], 15)
      })
    })

    describe('Semester tab', () => {
      beforeEach(() => {
        cy.contains('By semesters').click()
        chooseSemester('Syksy 2017', 'from')
        chooseSemester('Kevät 2024', 'to')
      })

      it('Semester tab shows numbers', () => {
        checkNumbers([69, 26, 298, 58, 343, 98, 438, 138, 310, 90, 123, 74, 10, 1, 2076], 16)
      })

      it('Coloring mode works on semester tab', () => {
        cy.contains('Compare to average of course').click()
        const expectedAlphas = [0.04, 0.016, 0.17, 0.03, 0.192, 0.055, 0.247, 0.08, 0.173, 0.05, 0.07, 0.043, 0.004, 0]

        checkStyle(
          expectedAlphas.map(alpha => `background-color: rgba(0, 170, 0, ${alpha})`),
          16
        )
        cy.get('table > tbody > tr:first').within(() => {
          cy.get('td').eq(15).should('have.attr', 'style').and('not.include', 'background-color')
        })
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
