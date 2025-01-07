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
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Basic information')
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Students by starting year')
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Graduation times')
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Update statistics')
      })
    })

    describe('Basic user', () => {
      beforeEach(() => {
        cy.init('/faculties')
        cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      })

      describe('Info boxes', () => {
        it('Students of the faculty', () => {
          cy.get('[data-cy=StudentsOfTheFacultyInfoBoxButton]').click()
          cy.get('[data-cy=StudentsOfTheFacultyInfoBoxContent]').contains('Taulukon luvut on')
        })

        it('Graduated of the faculty', () => {
          cy.get('[data-cy=GraduatedOfTheFacultyInfoBoxButton]').click()
          cy.get('[data-cy=GraduatedOfTheFacultyInfoBoxContent]').contains('Sisältää kyseisenä')
        })

        it('Thesis writers of the faculty', () => {
          cy.get('[data-cy=ThesisWritersOfTheFacultyInfoBoxButton]').click()
          cy.get('[data-cy=ThesisWritersOfTheFacultyInfoBoxContent]').contains('Sisältää kyseisenä')
        })

        it('Credits produced by the faculty', () => {
          cy.get('[data-cy=CreditsProducedByTheFacultyInfoBoxButton]').click()
          cy.get('[data-cy=CreditsProducedByTheFacultyInfoBoxContent]').contains('Sisältää opintopisteet')
        })
      })

      it('All graphs and tables are shown', () => {
        cy.get('[data-cy="StudentsOfTheFacultyGraph"]').should('be.visible')
        cy.get('[data-cy="StudentsOfTheFacultyInteractiveDataTable"]').should('be.visible')
        cy.get('[data-cy="GraduatedOfTheFacultyGraph"]').should('be.visible')
        cy.get('[data-cy="GraduatedOfTheFacultyInteractiveDataTable"]').should('be.visible')
        cy.get('[data-cy="ThesisWritersOfTheFacultyGraph"]').should('be.visible')
        cy.get('[data-cy="ThesisWritersOfTheFacultyInteractiveDataTable"]').should('be.visible')
        cy.get('[data-cy="CreditsProducedByTheFacultyGraph"]').should('be.visible')
        cy.get('[data-cy="CreditsProducedByTheFacultyInteractiveDataTable"]').should('be.visible')
      })

      it('Correct tabs are shown', () => {
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Basic information')
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Students by starting year')
        cy.get('[data-cy="FacultyTabs"]').should('contain', 'Graduation times')
        cy.get('[data-cy="FacultyTabs"]').should('not.contain', 'Update statistics')
      })

      it('Toggle years works', () => {
        cy.get('[data-cy="CreditsProducedByTheFacultyInteractiveDataTable"]').should('contain', '2022')
        cy.get('[data-cy="ThesisWritersOfTheFacultyInteractiveDataTable"]').should('contain', '2022')
        cy.get('[data-cy="StudentsOfTheFacultyInteractiveDataTable"]').should('contain', '2022')
        cy.get('[data-cy="GraduatedOfTheFacultyInteractiveDataTable"]').should('contain', '2022')
        cy.get('[data-cy="YearToggle"]').click()
        cy.get('[data-cy="CreditsProducedByTheFacultyInteractiveDataTable"]').should('contain', '2022 - 2023')
        cy.get('[data-cy="ThesisWritersOfTheFacultyInteractiveDataTable"]').should('contain', '2022 - 2023')
        cy.get('[data-cy="StudentsOfTheFacultyInteractiveDataTable"]').should('contain', '2022 - 2023')
        cy.get('[data-cy="GraduatedOfTheFacultyInteractiveDataTable"]').should('contain', '2022 - 2023')
      })

      it('Toggle programmes works', () => {
        cy.get('[data-cy="FacultyProgrammesShownInfo"]').should('not.exist')
        cy.get('[data-cy="ProgrammeToggle"]').click()
        cy.get('[data-cy="FacultyProgrammesShownInfo"]').should('be.visible')
      })

      it('Toggle study rights works', () => {
        cy.get('[data-cy="FacultyExcludeSpecialsInfo"]').should('not.exist')
        cy.get('[data-cy="StudentToggle"]').click()
        cy.get('[data-cy="FacultyExcludeSpecialsInfo"]').should('be.visible')
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
          cy.get(`[data-cy="${section}Graph"]`).within(() => {
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
      cy.get('[data-cy=FacultyStudentTableExportButton]').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_programme_stats_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it('Info box', () => {
      cy.get('[data-cy=FacultyStudentTableInfoBoxButton]').click()
      cy.get('[data-cy=FacultyStudentTableInfoBoxContent]').contains('Opiskelijat, joiden')
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
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', '92.3 %')
      cy.get('[data-cy="HidePercentagesToggle"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('contain', '92.3 %')
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
      cy.get('[data-cy=FacultyProgressExportButton]').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_progress_tab_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it.skip('Info boxes', () => {
      cy.get('[data-cy=FacultyProgressInfoBoxButton]').click()
      cy.get('[data-cy=FacultyProgressInfoBoxContent]').contains('Kuvaa tiedekuntaan')
      // TODO: Click open the accordion first
      cy.get('[data-cy=BachelorMastersProgressInfoBoxButton]').click()
      cy.get('[data-cy=BachelorMastersProgressInfoBoxContent]').contains('The starting year is the')
    })

    it.skip('Progress bar charts exist', () => {
      // TODO: Click open the accordion first
      cy.get('[data-cy="FacultyBachelorsProgressBarChart"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorMastersProgressBarChart"]').should('be.visible')
      cy.get('[data-cy="FacultyMastersProgressBarChart"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorsProgressBarChart"]').should('be.visible')
    })

    it.skip('Progress tables exist', () => {
      // TODO: Click open the accordion first
      cy.get('[data-cy="FacultyBachelorsProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorMasterProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyMastersProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorsProgressTable"]').should('be.visible')
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
      cy.get('[data-cy=AverageGraduationTimesExportButton]').should('be.visible').and('not.be.disabled').click()
      const downloadedFile = `oodikone_H50_graduation_times_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })

    it('Info boxes', () => {
      cy.get('[data-cy=AverageGraduationTimesInfoBoxButton]').click()
      cy.get('[data-cy=AverageGraduationTimesInfoBoxContent]').contains('Opiskelijoiden keskimääräiset')
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
      cy.get('[data-cy="bachelorGraduationTimes"]').should('be.visible')
      // ! No test data for bachelor + master
      cy.get('[data-cy="masterGraduationTimes"]').should('be.visible')
      cy.get('[data-cy="doctorGraduationTimes"]').should('be.visible')
    })
  })
})
