import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
test.describe('Teachers page tests', () => {
  test.beforeEach(async ({ page }) => {
    // login as admin = has teacher rights
    cy.init('/teachers', 'admin')
    cy.url().should('include', '/teachers')
  })
  const teacher1 = 'Luokkanen Liisa Viljami'
  const teacher2 = 'Perälä Juhani Susanna'
  const statisticsHeaders = ['Name', 'Credits', 'Credits transferred', 'Passed']
  test('Check Statistics', async ({ page }) => {
    cy.cs('semester-start').click()
    page.locator('text=Syksy 2020').click()
    cy.cs('course-providers').click()
    page.locator('text=Matemaattisten tieteiden kandiohjelma').click()
    page.locator('body').click(0, 0)
    cy.cs('search-statistics').click()
    cy.contains('Teacher')
    expect(page.locator('table thead tr th')).toHaveCount(4)
    statisticsHeaders.forEach((header, index) => {
      cy.get('table thead tr th').eq(index).should('contain', header)
    })
    cy.contains('td', teacher1).siblings().eq(0).contains('235')
    cy.contains('td', teacher1).siblings().eq(2).contains('97.40%')
    cy.contains('td', teacher2).siblings().eq(0).contains('395')
    cy.contains('td', teacher2).siblings().eq(2).contains('98.78%')
  })
  test('Teacher search works', async ({ page }) => {
    cy.cs('Search').click()
    cy.cs('teacher-search').type(teacher1.split(' ')[0])
    expect(page.locator('table tbody tr')).toHaveCount(4)
    cy.get('table tbody tr').eq(2).contains('td', teacher1)
  })
  test('Can check teacher page', async ({ page }) => {
    cy.cs('Search').click()
    cy.cs('teacher-search').type(teacher2)
    // Prevent opening in new tab
    cy.contains('a', teacher2).invoke('removeAttr', 'target').click()
    cy.url().should('include', '/teachers/hy-hlo-49026530')
    cy.contains(teacher2)
    page.locator('text=Syksy 2023').click()
    page.locator('text=Kev\u00E4t 2019').click()
    cy.contains('tr', 'MAT12004').within(() => {
      const rowContent = ['MAT12004', 'Tilastollinen päättely I', '120', '0', '92.31%']
      rowContent.forEach((content, index) => {
        cy.get('td').eq(index).contains(content)
      })
    })
  })
  test('Check leaderboad works', async ({ page }) => {
    cy.cs('Leaderboard').click()
    cy.cs('academic-year').click()
    page.locator('text=2020-2021').click()
  })
})
