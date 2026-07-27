import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const visibleLinks = {
  norights: ['University', 'Faculties', 'Special populations', 'Feedback'],
  onlycoursestatistics: ['University', 'Courses', 'Special populations', 'Feedback'],
}
visibleLinks.basic = [...visibleLinks.onlycoursestatistics, 'Faculties', 'Programmes', 'Students']
visibleLinks.admin = [...visibleLinks.basic, 'Teachers', 'Admin']
const containsLinks = async (page, links) => {
  cy.cs('nav-bar').within(() => {
    for (const link of links) {
      cy.contains(link)
    }
  })
}
const userButtonWorks = async (page, username, mocking = false) => {
  cy.cs('nav-bar-user-button').click()
  cy.contains(mocking ? `Mocking as ${username}` : `Logged in as ${username}`)
  cy.contains('Language')
  cy.contains('suomi')
  cy.contains('English')
  cy.contains('svenska')
  cy.contains(mocking ? 'Stop mocking' : 'Log out')
}
test.describe('Users tests', () => {
  test.describe('Using as user with just grp-oodikone-user, no other rights', () => {
    test('shows correct tabs', async ({ page }) => {
      cy.init('', 'norights')
      containsLinks(page)
      userButtonWorks(page)
    })
  })
  test.describe('Using as coursestatistics user', () => {
    test('shows correct tabs', async ({ page }) => {
      cy.init('', 'onlycoursestatistics')
      containsLinks(page)
      userButtonWorks(page)
    })
  })
  test.describe('Using as basic user', () => {
    test('shows correct tabs', async ({ page }) => {
      cy.init('')
      containsLinks(page)
      userButtonWorks(page)
    })
  })
  test.describe('Using as admin', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/users', 'admin')
    })
    test('should see more stuff than others', async ({ page }) => {
      containsLinks(page)
      userButtonWorks(page)
    })
    test.describe('can mock as other users', () => {
      test.beforeEach(async ({ page }) => {
        cy.cs('user-page-button-basic').click()
        cy.cs('mock-button').click()
      })
      test('user button shows mocked user', async ({ page }) => {
        userButtonWorks(page)
      })
      test("only the mocked user's programmes are visible", async ({ page }) => {
        cy.intercept('/api/populationstatistics/studyprogrammes').as('studyprogrammes')
        page.goto('/populations')
        cy.wait('@studyprogrammes').its('response.statusCode').should('be.oneOf', [200, 304])
        cy.contains('h6', 'Degree programme')
        cy.cs('population-programme-selector').within(() =>
          cy.get('input').should('have.attr', 'placeholder', 'Select degree programme')
        )
        cy.cs('population-programme-selector-parent').click()
        cy.cs('population-programme-selector-parent').within(() => cy.contains('Matemaattisten tieteiden kandiohjelma'))
        cy.cs('population-programme-selector-parent').within(() =>
          cy.contains('Matematiikan ja tilastotieteen maisteriohjelma')
        )
      })
    })
  })
})
