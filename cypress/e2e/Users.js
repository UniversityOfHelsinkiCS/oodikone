/// <reference types="cypress" />

const visibleLinks = {
  norights: ['University', 'Faculties', 'Special populations', 'Feedback'],
  onlycoursestatistics: ['University', 'Courses', 'Special populations', 'Feedback'],
}

visibleLinks.basic = [...visibleLinks.onlycoursestatistics, 'Faculties', 'Programmes', 'Students']
visibleLinks.admin = [...visibleLinks.basic, 'Teachers', 'Admin']

const hasVisibleItems = visibleItems => {
  cy.get('[data-cy=nav-bar]').children().should('have.length', visibleItems)
}

const containsLinks = links => {
  cy.get('[data-cy=nav-bar]').within(() => {
    for (const link of links) {
      cy.contains(link)
    }
  })
}

const userButtonWorks = (username, mocking = false) => {
  cy.get('[data-cy=nav-bar-user-button]').click()
  cy.contains(mocking ? `Mocking as ${username}` : `Logged in as ${username}`)
  cy.contains('Language')
  cy.contains('suomi')
  cy.contains('English')
  cy.contains('svenska')
  cy.contains(mocking ? 'Stop mocking' : 'Log out')
}

describe('Users tests', () => {
  describe('Using as user with just grp-oodikone-user, no other rights', () => {
    it('shows correct tabs', () => {
      cy.init('', 'norights')
      hasVisibleItems(7)
      containsLinks(visibleLinks.norights)
      userButtonWorks('norights')
    })
  })

  describe('Using as coursestatistics user', () => {
    it('shows correct tabs', () => {
      cy.init('', 'onlycoursestatistics')
      hasVisibleItems(7)
      containsLinks(visibleLinks.onlycoursestatistics)
      userButtonWorks('onlycoursestatistics')
    })
  })

  describe('Using as basic user', () => {
    it('shows correct tabs', () => {
      cy.init('')
      hasVisibleItems(10)
      containsLinks(visibleLinks.basic)
      userButtonWorks('basic')
    })
  })

  describe('Using as admin', () => {
    beforeEach(() => {
      cy.init('/users', 'admin')
    })

    it('should see more stuff than others', () => {
      hasVisibleItems(13)
      containsLinks(visibleLinks.admin)
      userButtonWorks('admin')
    })

    describe('can mock as other users', () => {
      beforeEach(() => {
        cy.cs('user-edit-button-basic').click()
        cy.get('i.spy').click()
      })

      it('user button shows mocked user', () => {
        userButtonWorks('basic', true)
      })

      it("only the mocked user's programmes are visible", () => {
        cy.get('[data-cy=nav-bar-button-studyProgramme]').click()
        cy.get('[data-cy=nav-bar-button-class]').click()
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
})
