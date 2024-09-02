/// <reference types="cypress" />

const visibleLinks = {
  norights: ['University', 'Faculties', 'Special populations', 'Give feedback', 'Logout'],
  onlycoursestatistics: ['University', 'Courses', 'Special populations', 'Give feedback', 'Logout'],
}

visibleLinks.basic = [...visibleLinks.onlycoursestatistics, 'Faculties', 'Programmes', 'Students']
visibleLinks.admin = [...visibleLinks.basic, 'Teachers', 'Users', 'Updater']

describe('Users tests', () => {
  describe('Using user with just grp-oodikone-user, no other rights', () => {
    it('shows correct tabs', () => {
      cy.init('', 'norights')
      cy.get('[data-cy=navBar]').children().should('have.length', 7)
      cy.get('[data-cy=navBar]').within(() => {
        for (const link of visibleLinks.norights) {
          cy.contains(link)
        }
      })
    })
  })

  describe('Using as coursestatistics user', () => {
    it('shows correct tabs', () => {
      cy.init('', 'onlycoursestatistics')
      cy.get('[data-cy=navBar]').children().should('have.length', 7)
      cy.get('[data-cy=navBar]').within(() => {
        for (const link of visibleLinks.onlycoursestatistics) {
          cy.contains(link)
        }
      })
    })
  })

  describe('Using as basic user', () => {
    it('shows correct tabs', () => {
      cy.init('')
      cy.get('[data-cy=navBar]').children().should('have.length', 10)
      cy.get('[data-cy=navBar]').within(() => {
        for (const link of visibleLinks.basic) {
          cy.contains(link)
        }
      })
    })
  })

  describe('Using as admin', () => {
    beforeEach(() => {
      cy.init('/users', 'admin')
    })

    it('should see more stuff than others', () => {
      cy.get('[data-cy=navBar]').children().should('have.length', 13)
      cy.get('[data-cy=navBar]').within(() => {
        for (const link of visibleLinks.admin) {
          cy.contains(link)
        }
      })
    })

    it("mocking normal user shows only the mocked user's programmes", () => {
      cy.contains('mocking').should('not.exist')
      cy.cs('user-edit-button-basic').click()
      cy.get('i.spy').click()
      cy.contains('mocking as basic')
      cy.contains('Programmes').click().siblings().contains('Class statistics').click()
      cy.contains('label', 'Study programme')
        .siblings()
        .within(() => {
          cy.get("div[role='option']").should('have.length', 2)
          cy.get("div[role='option']").eq(0).contains('Matemaattisten tieteiden kandiohjelma')
          cy.get("div[role='option']").eq(1).contains('Matematiikan ja tilastotieteen maisteriohjelma')
        })
    })
  })
})
