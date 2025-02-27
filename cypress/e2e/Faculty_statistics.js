/// <reference types="cypress" />

const path = require('path')

const timestamp = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) // YYYY-MM-DD, taking the local time zone into account
const downloadsFolder = Cypress.config('downloadsFolder')

describe('Faculty statistics', () => {
  describe('Faculty list', () => {
    beforeEach(() => {
      cy.init('/faculties')
    })

    it('contains faculty names and faculty codes', () => {
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

    it('contains a working link to faculty page', () => {
      cy.contains('Faculties')
      cy.contains('a', 'Teologinen tiedekunta').click()
      cy.location('pathname').should('eq', '/faculties/hy-org-1000000580')
      cy.contains('Teologinen tiedekunta')
      cy.contains('H10')
    })
  })

  describe('Basic information tab', () => {
    describe('Admin user', () => {
      beforeEach(() => {
        cy.init('/faculties', 'admin')
        cy.contains('a', 'Eläinlääketieteellinen tiedekunta').click()
      })

      it('Correct tabs are shown', () => {
        cy.cs('faculty-tabs').should('contain', 'Basic information')
        cy.cs('faculty-tabs').should('contain', 'Students by starting year')
        cy.cs('faculty-tabs').should('contain', 'Graduation times')
        cy.cs('faculty-tabs').should('contain', 'Update statistics')
      })
    })

    describe('Basic user', () => {
      beforeEach(() => {
        cy.init('/faculties')
        cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      })

      describe('Info boxes', () => {
        it('Students of the faculty', () => {
          cy.cs('students-of-the-faculty-info-box-button').click()
          cy.cs('students-of-the-faculty-info-box-content').contains('Taulukon luvut on')
        })

        it('Graduated of the faculty', () => {
          cy.cs('graduated-of-the-faculty-info-box-button').click()
          cy.cs('graduated-of-the-faculty-info-box-content').contains('Sisältää kyseisenä')
        })

        it('Thesis writers of the faculty', () => {
          cy.cs('thesis-writers-of-the-faculty-info-box-button').click()
          cy.cs('thesis-writers-of-the-faculty-info-box-content').contains('Sisältää kyseisenä')
        })

        it('Credits produced by the faculty', () => {
          cy.cs('credits-produced-by-the-faculty-info-box-button').click()
          cy.cs('credits-produced-by-the-faculty-info-box-content').contains('Sisältää opintopisteet')
        })
      })

      it('All graphs and tables are shown', () => {
        cy.cs('students-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('students-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('graduated-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('thesis-writers-of-the-faculty-line-graph-section').should('be.visible')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('be.visible')
        cy.cs('credits-produced-by-the-faculty-stacked-bar-chart-section').should('be.visible')
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('be.visible')
      })

      it('Correct tabs are shown', () => {
        cy.cs('faculty-tabs').should('contain', 'Basic information')
        cy.cs('faculty-tabs').should('contain', 'Students by starting year')
        cy.cs('faculty-tabs').should('contain', 'Graduation times')
        cy.cs('faculty-tabs').should('not.contain', 'Update statistics')
      })

      it('Toggle years works', () => {
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('students-of-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('contain', '2022')
        cy.cs('year-toggle').click()
        cy.cs('credits-produced-by-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('thesis-writers-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('students-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
        cy.cs('graduated-of-the-faculty-interactive-data-table').should('contain', '2022 - 2023')
      })

      it('Toggle programmes works', () => {
        cy.cs('faculty-programmes-shown-info').should('not.exist')
        cy.cs('programme-toggle').click()
        cy.cs('faculty-programmes-shown-info').should('be.visible')
      })

      it('Toggle study rights works', () => {
        cy.cs('faculty-exclude-specials-info').should('not.exist')
        cy.cs('study-right-toggle').click()
        cy.cs('faculty-exclude-specials-info').should('be.visible')
      })

      it.skip('Data can be exported to Excel files', { retries: 2 }, () => {
        // TODO: Fix this test
        const sections = [
          'StudentsOfTheFaculty',
          'GraduatedOfTheFaculty',
          'ThesisWritersOfTheFaculty',
          'CreditsProducedByTheFaculty',
        ]
        sections.forEach(section => {
          cy.cs(`${section}Graph`).within(() => {
            cy.get('[aria-label="View chart menu, Chart"]').click({ force: true })
            cy.contains('li.highcharts-menu-item', 'Download XLS').click()
            const downloadedFile = `oodikone_${section}_H50_${timestamp}.xls`
            cy.readFile(path.join(downloadsFolder, downloadedFile))
          })
        })
      })
    })
  })

  describe('Students by starting year tab', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      cy.contains('Students by starting year').click()
    })

    it('Export button', { retries: 2 }, () => {
      cy.cs('faculty-student-table-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_programme_stats_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it('Info box', () => {
      cy.cs('faculty-student-table-info-box-button').click()
      cy.cs('faculty-student-table-info-box-content').contains('Opiskelijat, joiden')
    })

    it.skip('Study right toggle', () => {
      // TODO: Implement
    })

    it.skip('Graduated toggle', () => {
      // TODO: Implement
    })

    it.skip('Hoverable country list', () => {
      // TODO: Implement
    })

    it.skip('Expandable rows', () => {
      // TODO: Implement
    })

    it.skip('Population links', () => {
      // TODO: Implement
    })

    it('Percentage toggle works', () => {
      cy.cs('faculty-student-stats-table').should('be.visible')
      cy.cs('faculty-student-stats-table').should('not.contain', '92.3 %')
      cy.cs('percentage-toggle').click()
      cy.cs('faculty-student-stats-table').should('contain', '92.3 %')
    })
  })

  describe('Progress tab', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      cy.contains('Progress').click()
    })

    it.skip('Export button', { retries: 2 }, () => {
      // TODO: Fix this test
      cy.cs('FacultyProgress-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_progress_tab_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it.skip('Info boxes', () => {
      cy.cs('FacultyProgress-info-box-button').click()
      cy.cs('FacultyProgress-info-box-content').contains('Kuvaa tiedekuntaan')
      // TODO: Click open the accordion first
      cy.cs('BachelorMastersProgress-info-box-button').click()
      cy.cs('BachelorMastersProgress-info-box-content').contains('The starting year is the')
    })

    it.skip('Progress bar charts exist', () => {
      // TODO: Click open the accordion first
      cy.cs('FacultyBachelorsProgressBarChart').should('be.visible')
      cy.cs('FacultyBachelorMastersProgressBarChart').should('be.visible')
      cy.cs('FacultyMastersProgressBarChart').should('be.visible')
      cy.cs('FacultyBachelorsProgressBarChart').should('be.visible')
    })

    it.skip('Progress tables exist', () => {
      // TODO: Click open the accordion first
      cy.cs('FacultyBachelorsProgressTable').should('be.visible')
      cy.cs('FacultyBachelorMasterProgressTable').should('be.visible')
      cy.cs('FacultyMastersProgressTable').should('be.visible')
      cy.cs('FacultyBachelorsProgressTable').should('be.visible')
    })

    it.skip('Graduated toggle', () => {
      // TODO: Implement
    })

    it.skip('Study right toggle', () => {
      // TODO: Implement
    })
  })

  describe('Graduation times tab', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      cy.contains('Graduation times').click()
    })

    it.skip('Export button', { retries: 2 }, () => {
      // TODO: Fix this test
      cy.cs('average-graduation-times-export-button').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_graduation_times_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it('Info boxes', () => {
      cy.cs('average-graduation-times-info-box-button').click()
      cy.cs('average-graduation-times-info-box-content').contains('Opiskelijoiden keskimääräiset')
    })

    it.skip('Study times toggle', () => {
      // TODO: Implement
    })

    it.skip('Year toggle', () => {
      // TODO: Implement
    })

    it.skip('Study programme toggle', () => {
      // TODO: Implement
    })

    it('Graphs are visible', () => {
      cy.cs('bachelor-graduation-times-section').should('be.visible')
      // ! No test data for bachelor + master
      cy.cs('master-graduation-times-section').should('be.visible')
      cy.cs('doctor-graduation-times-section').should('be.visible')
    })
  })
})
