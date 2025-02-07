/// <reference types="cypress" />

const visibleLinks = {
  norights: ['University', 'Faculties', 'Special populations', 'Feedback'],
  onlycoursestatistics: ['University', 'Courses', 'Special populations', 'Feedback'],
}

visibleLinks.basic = [...visibleLinks.onlycoursestatistics, 'Faculties', 'Programmes', 'Students']
visibleLinks.admin = [...visibleLinks.basic, 'Teachers', 'Admin']

const containsLinks = links => {
  cy.cs('nav-bar').within(() => {
    for (const link of links) {
      cy.contains(link)
    }
  })
}

const userButtonWorks = (username, mocking = false) => {
  cy.cs('nav-bar-user-button').click()
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
      containsLinks(visibleLinks.norights)
      userButtonWorks('norights')
    })
  })

  describe('Using as coursestatistics user', () => {
    it('shows correct tabs', () => {
      cy.init('', 'onlycoursestatistics')
      containsLinks(visibleLinks.onlycoursestatistics)
      userButtonWorks('onlycoursestatistics')
    })
  })

  describe('Using as basic user', () => {
    it('shows correct tabs', () => {
      cy.init('')
      containsLinks(visibleLinks.basic)
      userButtonWorks('basic')
    })
  })

  describe('Using as admin', () => {
    beforeEach(() => {
      cy.init('/users', 'admin')
    })

    it('should see more stuff than others', () => {
      containsLinks(visibleLinks.admin)
      userButtonWorks('admin')
    })

    describe('can mock as other users', { retries: 3 }, () => {
      beforeEach(() => {
        cy.cs('user-edit-button-basic').click()
        cy.get('i.spy').click()
      })

      it('user button shows mocked user', () => {
        userButtonWorks('basic', true)
      })

      it("only the mocked user's programmes are visible", () => {
        cy.visit('/populations')
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
