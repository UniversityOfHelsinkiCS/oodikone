/// <reference types="Cypress" />

describe('Users tests', () => {
  describe('Using user with just grp-oodikone-user, no other rights', () => {
    it('shows only frontpage, trends feedback', () => {
      cy.init('', 'norights') // login with norights user
      cy.get('[data-cy="navBar"]').contains('Trends').should('exist')
      cy.get('[data-cy="navBar"]').contains('Give feedback').should('exist')

      cy.get('[data-cy="navBar"]').contains('Study programme').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Student statistics').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Course statistics').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Teachers').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Users').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Faculty').should('not.exist')
      cy.get('[data-cy="navBar"]').contains('Updater').should('not.exist')
    })
  })

  // TODO: Add user right checks for onlycoursestats user (should be like above + should
  // show course stats
  //
  // TODO: Add user right checks for basic user (should show also study programme,
  // student stats, course stats

  describe('Using as admin', () => {
    beforeEach(() => {
      cy.init('/users', 'admin')
    })

    it('should see more stuff than others', () => {
      cy.get('[data-cy="navBar"]').contains('Study programme').should('exist')
      cy.get('[data-cy="navBar"]').contains('Student statistics').should('exist')
      cy.get('[data-cy="navBar"]').contains('Course statistics').should('exist')
      // TODO: admin should probably see this as well, since can access this page: cy.get('[data-cy="navBar"]').contains('Teachers').should('exist')
      cy.get('[data-cy="navBar"]').contains('Users').should('exist')
      cy.get('[data-cy="navBar"]').contains('Trends').should('exist')
    })

    it("mocking normal user shows only the mocked user's programmes", () => {
      cy.contains('mocking').should('not.exist')
      cy.contains('tr', 'basic').within($row => {
        cy.contains('.button', 'Edit').click()
      })
      cy.intercept({
        method: 'POST',
        path: '/api/superlogin/basic',
      }).as('superlogin')
      cy.get('i.spy').click()
      cy.wait('@superlogin')
      cy.contains('mocking as basic')
      cy.wait(1000)
      cy.contains('Study programme').click().siblings().contains('Search by class').click()
      cy.contains('label', 'Study programme')
      cy.contains('label', 'Study programme')
        .siblings()
        .within($row => {
          cy.get("div[role='option']").should('have.length', 2).contains('Tietojenkäsittelytieteen kandiohjelma')
        })
    })
  })
})
