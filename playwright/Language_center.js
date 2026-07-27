import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const chooseSemester = async (page, semester, fromOrTo) => {
  cy.cs(`semester-${fromOrTo}`).click()
  cy.cs(`select-opt-${semester}`).click()
  cy.cs(`select-opt-${semester}`).should('not.have.class', 'visible')
}
const checkNumbers = async (page, numbers, numberOfColumns, mode) => {
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
test.describe('When language center is opened', () => {
  test.describe('as an admin user', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/languagecenterview', 'admin')
      cy.cs('completions-button').click()
    })
    test.describe('Faculties tab', () => {
      test.beforeEach(async ({ page }) => {
        chooseSemester(page)
        chooseSemester(page)
      })
      test('Initial view is correct', async ({ page }) => {
        cy.contains('All courses total')
        cy.contains('Academic and Professional')
        cy.contains('AYKK-RUKIRJ')
      })
      test('Faculties tab shows numbers', async ({ page }) => {
        cy.get('table > tbody > tr:first').within(() => {
          expect(page.locator('td')).toHaveCount(15)
          cy.get('td').eq(0).contains('All courses total')
          const numbers = [2076, 36, 9, 34, 759, 15, 40, 6, 51, 1, 24, 1059, 42, 0]
          numbers.forEach((number, index) => {
            cy.get('td')
              .eq(index + 1)
              .contains(number)
          })
        })
      })
      test('Faculties tab "exceeding" button works', async ({ page }) => {
        cy.cs('difference-button').click()
        checkNumbers(page)
      })
      test('Faculties tab semester selector changes numbers', async ({ page }) => {
        chooseSemester(page)
        checkNumbers(page)
      })
    })
    test.describe('Semester tab', () => {
      test.beforeEach(async ({ page }) => {
        page.locator('text=By semesters').click()
        chooseSemester(page)
        chooseSemester(page)
      })
      test('Semester tab shows numbers', async ({ page }) => {
        checkNumbers(page)
      })
    })
  })
  test.describe('with a user with no rights', () => {
    test('"Access denied" is shown', async ({ page }) => {
      cy.init('/languagecenterview', 'norights')
      cy.contains('Access denied')
      cy.contains("You don't currently have permission to view this page.")
      page.locator('text=Special populations').click()
      cy.contains('Language center view').should('not.exist')
    })
  })
})
