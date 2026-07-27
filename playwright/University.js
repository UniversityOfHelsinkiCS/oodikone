import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const progressLevels = ['bachelors', 'bachelor-masters', 'masters', 'doctoral']
const checkProgressBarCharts = async page => {
  progressLevels.forEach(level => cy.cs(`faculty-${level}-progress-bar-chart-section`))
}
const checkProgressTables = async page => {
  progressLevels.forEach(level => cy.cs(`${level}-faculty-progress-table`))
}
const graduationTimesLevels = ['bachelor', 'bcMsCombo', 'master', 'doctor']
const checkGraduationCharts = async (page, mode) => {
  graduationTimesLevels.forEach(level => {
    cy.cs(`${level}-${mode}-bar-chart`).within(() => {
      // Check that bar has loaded
      cy.contains('Loading content').should('not.exist')
    })
  })
}
test.describe('University view', () => {
  test.beforeEach(async ({ page }) => {
    cy.init('/university')
    cy.contains('University')
  })
  test.describe('Faculty progress tab', () => {
    test('contains all the correct progress bar charts', async ({ page }) => {
      checkProgressBarCharts(page)
    })
    test('contains all the correct progress tables', async ({ page }) => {
      checkProgressTables(page)
    })
    test("'All study rights / Special study rights excluded' toggle works", async ({ page }) => {
      cy.cs('study-right-toggle').click()
      checkProgressBarCharts(page)
      checkProgressTables(page)
    })
    test.skip('years in the tables can be clicked to show faculty level breakdown', async ({ page }) => {
      cy.cs('study-right-toggle').click()
      cy.cs('bachelors-faculty-progress-table-show-button3').click()
      cy.contains('29.5%').hover()
      cy.contains('Matemaattis-luonnontieteellinen tiedekunta')
      cy.contains('H50')
      cy.contains('0 Credits: 0')
      cy.contains('1 ≤ Credits < 45: 13')
      cy.contains('45 ≤ Credits < 90: 10')
      cy.contains('90 ≤ Credits < 135: 16')
      cy.contains('135 ≤ Credits < 180: 3')
      cy.contains('180 ≤ Credits: 2')
    })
    test('info boxes contain correct information', async ({ page }) => {
      cy.cs('faculty-progress-info-box-button').click()
      cy.cs('faculty-progress-info-box-content').contains('Kuvaa tiedekuntaan kuuluvien')
      cy.cs('faculty-bachelor-masters-progress-info-box-button').click()
      cy.cs('faculty-bachelor-masters-progress-info-box-content').contains('The starting year is the')
    })
  })
  test.describe('Faculty graduations tab', () => {
    test.beforeEach(async ({ page }) => {
      cy.cs('faculty-graduations-tab').click()
    })
    test.describe('Different modes work', () => {
      test('Breakdown', async ({ page }) => {
        cy.cs('graduation-mode-selector').within(() => {
          cy.cs('select-breakdown').click()
        })
        checkGraduationCharts(page)
      })
      test('Median', async ({ page }) => {
        cy.cs('graduation-mode-selector').within(() => {
          cy.cs('select-median').click()
        })
        checkGraduationCharts(page)
      })
      test('Average', async ({ page }) => {
        cy.cs('graduation-mode-selector').within(() => {
          cy.cs('select-average').click()
        })
        checkGraduationCharts(page)
      })
    })
    test('info boxes contain correct information', async ({ page }) => {
      cy.cs('average-graduation-times-info-box-button').hover()
      cy.cs('average-graduation-times-info-box-content').contains('Opiskelijoiden keskimääräiset valmistumisajat')
    })
  })
})
