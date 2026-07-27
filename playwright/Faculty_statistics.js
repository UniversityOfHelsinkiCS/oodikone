import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const path = require('path')
const timestamp = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) // YYYY-MM-DD, taking the local time zone into account
const downloadsFolder = '/tmp/cypress/downloads'
test.describe('Faculty statistics', () => {
  test.describe('Faculty list', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/faculties')
    })
    test('contains faculty names and faculty codes', async ({ page }) => {
      cy.contains('Faculties')
      cy.contains('Teologinen tiedekunta')
      cy.contains('H10')
      cy.contains('Oikeustieteellinen tiedekunta')
      cy.contains('H20')
      cy.contains('Lääketieteellinen tiedekunta')
      cy.contains('H30')
      cy.contains('Humanistinen tiedekunta')
      cy.contains('H40')
      cy.contains('Matemaattis-luonnontieteellinen tiedekunta')
      cy.contains('H50')
      cy.contains('Farmasian tiedekunta')
      cy.contains('H55')
      cy.contains('Bio- ja ympäristötieteellinen tiedekunta')
      cy.contains('H57')
      cy.contains('Kasvatustieteellinen tiedekunta')
      cy.contains('H60')
      cy.contains('Valtiotieteellinen tiedekunta')
      cy.contains('H70')
      cy.contains('Svenska social- och kommunalhögskolan')
      cy.contains('H74')
      cy.contains('Maatalous-metsätieteellinen tiedekunta')
      cy.contains('H80')
      cy.contains('Eläinlääketieteellinen tiedekunta')
      cy.contains('H90')
    })
    test('contains a working link to faculty page', async ({ page }) => {
      cy.contains('Faculties')
      page.locator('text=a', 'text=Teologinen tiedekunta').click()
      cy.location('pathname').should('eq', '/faculties/hy-org-1000000580')
      cy.contains('Teologinen tiedekunta')
      cy.contains('H10')
    })
  })
  test.describe('Basic information tab', () => {
    test.describe('Admin user', () => {
      test.beforeEach(async ({ page }) => {
        cy.init('/faculties', 'admin')
        page.locator('text=a', 'text=El\u00E4inl\u00E4\u00E4ketieteellinen tiedekunta').click()
      })
      test('Correct tabs are shown', async ({ page }) => {
        cy.cs('faculty-tabs').should('contain', 'Basic information')
        cy.cs('faculty-tabs').should('contain', 'Students by starting year')
        cy.cs('faculty-tabs').should('contain', 'Graduation times')
        cy.cs('faculty-tabs').should('contain', 'Update statistics')
      })
    })
    test.describe('Basic user', () => {
      test.beforeEach(async ({ page }) => {
        cy.init('/faculties')
        page.locator('text=a', 'text=Matemaattis-luonnontieteellinen tiedekunta').click()
      })
      test.describe('Info boxes', () => {
        test('Students of the faculty', async ({ page }) => {
          cy.cs('students-of-the-faculty-info-box-button').click()
          cy.cs('students-of-the-faculty-info-box-content').contains('Taulukon luvut on')
        })
        test('Graduated of the faculty', async ({ page }) => {
          cy.cs('graduated-of-the-faculty-info-box-button').click()
          cy.cs('graduated-of-the-faculty-info-box-content').contains('Sisältää kyseisenä')
        })
        test('Thesis writers of the faculty', async ({ page }) => {
          cy.cs('thesis-writers-of-the-faculty-info-box-button').click()
          cy.cs('thesis-writers-of-the-faculty-info-box-content').contains('Sisältää kyseisenä')
        })
        test('Credits produced by the faculty', async ({ page }) => {
          cy.cs('credits-produced-by-the-faculty-info-box-button').click()
          cy.cs('credits-produced-by-the-faculty-info-box-content').contains('Sisältää opintopisteet')
        })
      })
      test('All graphs and tables are shown', async ({ page }) => {
        cy.cs('students-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('students-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('graduated-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('thesis-writers-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('credits-produced-by-the-faculty-stacked-bar-chart-section').should('be.visible')
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('be.visible')
      })
      test('Correct tabs are shown', async ({ page }) => {
        cy.cs('faculty-tabs').should('contain', 'Basic information')
        cy.cs('faculty-tabs').should('contain', 'Students by starting year')
        cy.cs('faculty-tabs').should('contain', 'Graduation times')
        cy.cs('faculty-tabs').should('not.contain', 'Update statistics')
      })
      test('Toggle years works', async ({ page }) => {
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('students-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('year-toggle').click()
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('students-of-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('contain', '2022')
      })
      test('Toggle programmes works', async ({ page }) => {
        cy.cs('faculty-programmes-shown-info').should('not.exist')
        cy.cs('programme-toggle').click()
        cy.cs('faculty-programmes-shown-info').should('be.visible')
      })
      test('Toggle study rights works', async ({ page }) => {
        cy.cs('faculty-exclude-specials-info').should('not.exist')
        cy.cs('study-right-toggle').click()
        cy.cs('faculty-exclude-specials-info').should('be.visible')
      })
      test.skip('Data can be exported to Excel files', async ({ page }) => {
        // TODO: Fix this test
        const sections = [
          'StudentsOfTheFaculty',
          'GraduatedOfTheFaculty',
          'ThesisWritersOfTheFaculty',
          'CreditsProducedByTheFaculty',
        ]
        sections.forEach(section => {
          cy.cs(`${section}Graph`).within(() => {
            page.locator('[aria-label="View chart menu, Chart"]').click({ force: true })
            page.locator('text=li.highcharts-menu-item', 'text=Download XLS').click()
            const downloadedFile = `oodikone_${section}_H50_${timestamp}.xls`
            cy.readFile(path.join(downloadsFolder, downloadedFile))
          })
        })
      })
    })
  })
  test.describe('Students by starting year tab', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/faculties')
      page.locator('text=a', 'text=Matemaattis-luonnontieteellinen tiedekunta').click()
      page.locator('text=Students by starting year').click()
    })
    test('Export button', async ({ page }) => {
      cy.cs('faculty-student-table-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_programme_stats_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })
    test('Info box', async ({ page }) => {
      cy.cs('faculty-student-table-info-box-button').click()
      cy.cs('faculty-student-table-info-box-content').contains('Opiskelijat, joiden')
    })
    test.skip('Study right toggle', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Graduated toggle', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Hoverable country list', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Expandable rows', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Population links', async ({ page }) => {
      // TODO: Implement
    })
    test('Percentage toggle works', async ({ page }) => {
      cy.cs('faculty-student-stats-table').should('be.visible')
      cy.cs('faculty-student-stats-table').should('not.contain', '92.3 %')
      cy.cs('percentage-toggle').click()
      cy.cs('faculty-student-stats-table').should('contain', '92.3 %')
    })
  })
  test.describe('Progress tab', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/faculties')
      page.locator('text=a', 'text=Matemaattis-luonnontieteellinen tiedekunta').click()
      page.locator('text=Progress').click()
    })
    test.skip('Export button', async ({ page }) => {
      // TODO: Fix this test
      cy.cs('FacultyProgress-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_progress_tab_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })
    test.skip('Info boxes', async ({ page }) => {
      cy.cs('FacultyProgress-info-box-button').click()
      cy.cs('FacultyProgress-info-box-content').contains('Kuvaa tiedekuntaan')
      // TODO: Click open the accordion first
      cy.cs('BachelorMastersProgress-info-box-button').click()
      cy.cs('BachelorMastersProgress-info-box-content').contains('The starting year is the')
    })
    test.skip('Progress bar charts exist', async ({ page }) => {
      // TODO: Click open the accordion first
      cy.cs('FacultyBachelorsProgressBarChart').should('be.visible')
      cy.cs('FacultyBachelorMastersProgressBarChart').should('be.visible')
      cy.cs('FacultyMastersProgressBarChart').should('be.visible')
      cy.cs('FacultyBachelorsProgressBarChart').should('be.visible')
    })
    test.skip('Progress tables exist', async ({ page }) => {
      // TODO: Click open the accordion first
      cy.cs('FacultyBachelorsProgressTable').should('be.visible')
      cy.cs('FacultyBachelorMasterProgressTable').should('be.visible')
      cy.cs('FacultyMastersProgressTable').should('be.visible')
      cy.cs('FacultyBachelorsProgressTable').should('be.visible')
    })
    test.skip('Graduated toggle', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Study right toggle', async ({ page }) => {
      // TODO: Implement
    })
  })
  test.describe('Graduation times tab', () => {
    test.beforeEach(async ({ page }) => {
      cy.init('/faculties')
      page.locator('text=a', 'text=Matemaattis-luonnontieteellinen tiedekunta').click()
      page.locator('text=Graduation times').click()
    })
    test.skip('Export button', async ({ page }) => {
      // TODO: Fix this test
      cy.cs('average-graduation-times-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_graduation_times_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })
    test('Info boxes', async ({ page }) => {
      cy.cs('average-graduation-times-info-box-button').click()
      cy.cs('average-graduation-times-info-box-content').contains('Opiskelijoiden keskimääräiset')
    })
    test.skip('Study times toggle', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Year toggle', async ({ page }) => {
      // TODO: Implement
    })
    test.skip('Degree programme toggle', async ({ page }) => {
      // TODO: Implement
    })
    test('Graphs are visible', async ({ page }) => {
      cy.cs('bachelor-graduation-times-section').should('be.visible')
      // ! No test data for bachelor + master
      cy.cs('master-graduation-times-section').should('be.visible')
      cy.cs('doctor-graduation-times-section').should('be.visible')
    })
  })
})
