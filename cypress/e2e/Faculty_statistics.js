/// <reference types="Cypress" />

const path = require('path')

const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
const downloadsFolder = Cypress.config('downloadsFolder')

describe('Faculty overview', () => {
  describe('Faculty can be selected', () => {
    it('Faculties are listed and one can be chosen', () => {
      cy.init('/faculties')
      cy.get('[data-cy=select-faculty]').contains('a', 'Teologinen tiedekunta')
      cy.contains('a', 'H99').should('not.exist')
      cy.contains('a', 'Teologinen tiedekunta').click()
      cy.contains('.header', 'Teologinen tiedekunta')
    })
  })

  describe('Basic information: admin user', () => {
    beforeEach(() => {
      cy.init('/faculties', 'admin')
      cy.contains('a', 'Eläinlääketieteellinen tiedekunta').click()
    })

    it('Credits produced by faculty are shown', () => {
      cy.get('[data-cy="Section-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-CreditsProducedByTheFaculty"]').should('be.visible')
    })

    it('Update statistics tab is shown', () => {
      cy.get('[data-cy="FacultySegmentContainer"]').should('contain', 'Update statistics')
    })
  })

  describe('Basic information: basic user', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
    })

    it('Basic information tab show all graphs and tables', () => {
      cy.get('[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Table-ThesisWritersOfTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-ThesisWritersOfTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Table-StudentsOfTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-StudentsOfTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Table-GraduatedOfTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-GraduatedOfTheFaculty"]').should('be.visible')
    })

    it('Correct tabs are shown', () => {
      cy.get('[data-cy="FacultySegmentContainer"]').should('contain', 'Basic information')
      cy.get('[data-cy="FacultySegmentContainer"]').should('contain', 'Graduation times')
      cy.get('[data-cy="FacultySegmentContainer"]').should('contain', 'Programmes and student populations')
      cy.get('[data-cy="FacultySegmentContainer"]').should('not.contain', 'Update statistics')
    })

    it('Toggle years works', () => {
      cy.get('[data-cy="Table-CreditsProducedByTheFaculty"]').should('contain', '2022')
      cy.get('[data-cy="Table-ThesisWritersOfTheFaculty"]').should('contain', '2022')
      cy.get('[data-cy="Table-StudentsOfTheFaculty"]').should('contain', '2022')
      cy.get('[data-cy="Table-GraduatedOfTheFaculty"]').should('contain', '2022')
      cy.get('[data-cy="YearToggle"]').click()
      cy.get('[data-cy="Table-CreditsProducedByTheFaculty"]').should('contain', '2022 - 2023')
      cy.get('[data-cy="Table-ThesisWritersOfTheFaculty"]').should('contain', '2022 - 2023')
      cy.get('[data-cy="Table-StudentsOfTheFaculty"]').should('contain', '2022 - 2023')
      cy.get('[data-cy="Table-GraduatedOfTheFaculty"]').should('contain', '2022 - 2023')
    })

    it('Toggle programmes works', () => {
      cy.get('[data-cy="FacultyProgrammesShownInfo"]').should('not.exist')
      cy.get('[data-cy="ProgrammeToggle"]').click()
      cy.get('[data-cy="FacultyProgrammesShownInfo"]').should('be.visible')
    })

    it('Students of the faculty infobox works', () => {
      cy.get('[data-cy="StudentsOfTheFaculty-info-content"]').should('not.exist')
      cy.get('[data-cy="StudentsOfTheFaculty-open-info"]').click()
      cy.get('[data-cy="StudentsOfTheFaculty-info-content"]').should('be.visible')
      cy.get('[data-cy="StudentsOfTheFaculty-close-info"]').click()
      cy.get('[data-cy="StudentsOfTheFaculty-info-content"]').should('not.exist')
    })

    it('Data can be exported to Excel files', () => {
      const sections = [
        'StudentsOfTheFaculty',
        'GraduatedOfTheFaculty',
        'ThesisWritersOfTheFaculty',
        'CreditsProducedByTheFaculty',
      ]
      sections.forEach(section => {
        cy.get(`[data-cy="Graph-${section}"]`).within(() => {
          cy.get('[aria-label="View chart menu, Chart"]').click()
          cy.contains('li.highcharts-menu-item', 'Download XLS').click()
          const downloadedFile = `oodikone_${section}_H50_${timestamp}.xls`
          cy.readFile(path.join(downloadsFolder, downloadedFile))
        })
      })
    })
  })

  describe('Study programme information: users with access', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Maatalous-metsätieteellinen tiedekunta').click()
    })

    it('Study programme credit information is not visible in the beginning', () => {
      cy.get('table[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')

      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
    })

    it('Study programme credit information can be toggled', () => {
      cy.get('[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')

      cy.get('[data-cy="Button-Show-CreditsProducedByTheFaculty-0"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
      cy.get('[data-cy="Button-Show-CreditsProducedByTheFaculty-3"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
      cy.get('[data-cy="Button-Hide-CreditsProducedByTheFaculty-0"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-3"]').should('be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-4"]').should('not.be.visible')
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-5"]').should('not.be.visible')
    })

    it('Graph stays open when sorted', () => {
      cy.get('[data-cy="Table-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Button-Show-CreditsProducedByTheFaculty-0"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('[data-cy="Menu-CreditsProducedByTheFaculty-Total"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
    })
  })

  describe('Average graduation times', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Kasvatustieteellinen tiedekunta').click()
      cy.contains('Graduation times').click()
    })

    it('User can view graduation graphs', () => {
      cy.get('[data-cy="Section-AverageGraduationTimes"]').should('be.visible')
      cy.get('[data-cy="Section-bachelor"]').should('be.visible')
      cy.get('[data-cy="Section-master"]').should('be.visible')
      cy.get('[data-cy="Section-master"]').within(() => {
        cy.contains('text.highcharts-axis-title', 'Graduation year')
        cy.contains('.message', "Click a bar to view that year's programme level breakdown").should('be.visible')
      })
    })

    it('Graphs display data', () => {
      cy.get('[data-cy="Section-bachelor"]').within(() => {
        cy.get('div[class="faculty-breakdown-graph"]')
      })

      cy.get('[data-cy="GraduationTimeToggle"]').click()

      cy.get('[data-cy="Section-bachelor"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('1 graduated').should('have.length', 1)
        cy.contains('1 graduated').trigger('mouseover')
        cy.contains('1 students graduated in year 2019')
        cy.contains('median study time: 41 months')
        cy.contains('0 graduated on time')
        cy.contains('1 graduated max year overtime')

        cy.contains('1 graduated').click()
        cy.contains('Year 2019 by graduation year')
        cy.get('div[class="programmes-graph"]').should('be.visible')
        cy.get('div[class="programmes-graph"]').within(() => {
          cy.contains('EDUK')
          cy.get('[aria-label="EDUK, 41."]').trigger('mouseover')
          cy.contains('Kasvatustieteiden kandiohjelma')
          cy.contains('KH60_001')
        })
      })

      cy.get('[data-cy="Section-master"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('24 graduated').should('have.length', 1)
        cy.contains('24 graduated').trigger('mouseover')
        cy.contains('24 students graduated in year 2020')
        cy.contains('median study time: 22.5 months')
        cy.contains('0 graduated over year late')
        cy.contains('19 graduated on time')
        cy.contains('5 graduated max year overtime')

        cy.contains('24 graduated').click()
        cy.contains('Year 2020 by graduation year')
        cy.get('div[class="programmes-graph"]').should('be.visible')
        cy.get('div[class="programmes-graph"]').within(() => {
          cy.contains('EDUM')
          cy.get('[aria-label="EDUM, 22.5."]').trigger('mouseover')
          cy.contains('Kasvatustieteiden maisteriohjelma')
          cy.contains('MH60_001')
        })
      })
    })

    it('Graduation times grouping and time types can be toggled', () => {
      cy.get('[data-cy="GraduationTimeToggle"]').click()
      cy.get('[data-cy="GroupByToggle"]').click()
      cy.get('[data-cy="Section-bachelor"]').should('not.exist')
      cy.get('[data-cy="Section-master"]').should('be.visible')

      cy.get('[data-cy="Section-master"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('18 graduated (40 % of class)').should('have.length', 1)
        cy.contains('18 graduated').trigger('mouseover')
        cy.contains('From class of 2018 - 2019, 18/45 students have graduated')
      })

      cy.get('[data-cy="GraduationTimeToggle"]').click()
      cy.get('[data-cy="Section-master"]').within(() => {
        cy.get('[aria-label="2018 - 2019, 14. On time."]').click()
        cy.get('div[class="programmes-breakdown-graph"]').should('be.visible')
        cy.get('div[class="programmes-breakdown-graph"]').within(() => {
          cy.contains('Year 2018 - 2019 by start year')
          cy.contains('EDUM')
          cy.get('[aria-label="EDUM, 4. Max. year overtime."]').trigger('mouseover')
          cy.contains('Kasvatustieteiden maisteriohjelma')
          cy.contains('MH60_001')
        })
      })
    })

    it('Data can be exported to an Excel file', () => {
      cy.get('[data-cy="DownloadButton-AverageGraduationTimes"]').click()
      const downloadedFile = `oodikone_H60_graduation_times_${timestamp}.xlsx`
      cy.readFile(path.join(downloadsFolder, downloadedFile))
    })
  })

  describe('Faculty Progress and student population tab', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('a', 'Matemaattis-luonnontieteellinen tiedekunta').click()
      cy.contains('Programmes and student populations').click()
    })

    it('User can view studentdata table without %', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', '0 %')
    })

    it('User can view studentdata table with %', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="HidePercentagesToggle"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('contain', '0 %')
    })

    it('Percentage Graphs exists', () => {
      cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyBachelorMastersProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyMastersProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').should('be.visible')
    })

    it('Graduations can be excluded', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="StudentToggle"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
    })

    it('Transfers can be excluded', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="GraduatedToggle"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
    })

    it('Progress tables exists', () => {
      cy.get('[data-cy="FacultyBachelorsProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorMasterProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyMastersProgressTable"]').should('be.visible')
      cy.get('[data-cy="FacultyBachelorsProgressTable"]').should('be.visible')
    })

    it('Progress tables can be toggled', () => {
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-5"]').should('not.be.visible')
      cy.get('[data-cy="Button-Show-FacultyBachelorsProgressTable-5"]').click()
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-0"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-3"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-5"]').should('be.visible')
      cy.get('[data-cy="Button-Hide-FacultyBachelorsProgressTable-5"]').click()
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-5"]').should('not.be.visible')
    })

    it('Studentstats table can be toggled', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', 'TKT')
      cy.get('[data-cy="Button-FacultyStudentStatsTable-6"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('contain', 'TKT')
      cy.get('[data-cy="Button-FacultyStudentStatsTable-6"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', 'TKT')
    })

    it('Progress infobox can be toggled', () => {
      cy.get('[data-cy="InfoFacultyProgress-info-content"]').should('not.exist')
      cy.get('[data-cy="InfoFacultyProgress-open-info"]').click()
      cy.get('[data-cy="InfoFacultyProgress-info-content"]').should('be.visible')
      cy.get('[data-cy="InfoFacultyProgress-close-info"]').click()
      cy.get('[data-cy="InfoFacultyProgress-info-content"]').should('not.exist')
    })
  })
})
