/// <reference types="Cypress" />

describe('Faculty overview', () => {
  describe('Faculty can be selected', () => {
    it('Faculties are listed and one can be chosen', () => {
      cy.init('/faculties')
      cy.get('[data-cy=select-faculty]').contains('td', 'H10')
      cy.contains('td', 'H99').should('not.exist')
      cy.contains('td', 'H90').click()
      cy.contains('.header', 'Eläinlääketieteellinen tiedekunta')
    })
  })

  describe('Faculty basic information: admin user', () => {
    beforeEach(() => {
      cy.init('/faculties', 'admin')
      cy.contains('td', 'H90').click()
    })
    it('Credits produced by faculty are shown', () => {
      cy.get('[data-cy="Section-CreditsProducedByTheFaculty"]').should('be.visible')
      cy.get('[data-cy="Graph-CreditsProducedByTheFaculty"]').should('be.visible')
    })

    it('Update statistics tab is shown', () => {
      cy.get('[data-cy="FacultySegmentContainer"]').should('contain', 'Update statistics')
    })
  })

  describe('Faculty basic information: basic user', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('td', 'H80').click()
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
  })

  describe('Study programme information: users with access', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('td', 'H80').click()
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

      // I tried to fix this without cy.wait() method without effort. Sorting the programmes
      // or something else causes rerendering of the view and yield to failing tests.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
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
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000)
      cy.get('[data-cy="Button-Show-CreditsProducedByTheFaculty-0"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
      cy.get('[data-cy="Menu-CreditsProducedByTheFaculty-Total"]').click()
      cy.get('[data-cy="Cell-CreditsProducedByTheFaculty-0"]').should('be.visible')
    })
  })

  describe('Average graduation times', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('td', 'H60').click()
      cy.contains('Graduation times').click()
    })

    it('User can view graduation graphs', () => {
      cy.get('[data-cy="Section-AverageGraduationTimes"]').should('be.visible')
      cy.get('[data-cy="Section-bachelor"]').should('be.visible')
      cy.get('[data-cy="Section-master"]').should('be.visible')
      cy.get('[data-cy="Section-master"]').within(() => {
        cy.contains('Graduation year').should('be.visible')
        cy.contains('.message', "Click a bar to view that year's programme level breakdown").should('be.visible')
      })
    })

    it('Graphs display data', () => {
      cy.get('[data-cy="Section-bachelor"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('1 graduated').should('have.length', 1)
        cy.contains('1 graduated').trigger('mouseover')
        cy.contains('1 students graduated in year 2019')
        cy.contains('median study time: 40 months')
        cy.contains('0 graduated on time')
        cy.contains('1 graduated max year overtime')

        cy.contains('1 graduated').click()
        cy.contains('Year 2019 by graduation year')
        cy.get('div[class="programmes-graph"]').should('be.visible')
        cy.get('div[class="programmes-graph"]').within(() => {
          cy.contains('EDUK')
          cy.contains('1 graduated').trigger('mouseover')
          cy.contains('Kasvatustieteiden kandiohjelma')
          cy.contains('KH60_001')
        })
      })

      cy.get('[data-cy="Section-master"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('1 graduated').should('have.length', 1)
        cy.contains('1 graduated').trigger('mouseover')
        cy.contains('1 students graduated in year 2020')
        cy.contains('median study time: 25 months')
        cy.contains('0 graduated over year late')
        cy.contains('1 graduated max year overtime')

        cy.contains('1 graduated').click()
        cy.contains('Year 2020 by graduation year')
        cy.get('div[class="programmes-graph"]').should('be.visible')
        cy.get('div[class="programmes-graph"]').within(() => {
          cy.contains('EDUM')
          cy.contains('1 graduated').trigger('mouseover')
          cy.contains('Kasvatustieteiden maisteriohjelma')
          cy.contains('MH60_001')
        })
      })
    })

    it('Graduation times grouping and time types can be toggled', () => {
      cy.get('[data-cy="GroupByToggle"]').click()
      cy.get('[data-cy="Section-bachelor"]').should('not.exist')
      cy.get('[data-cy="Section-master"]').should('be.visible')

      cy.get('[data-cy="Section-master"]').within(() => {
        cy.get('div[class="faculty-graph"]')
        cy.contains('1 graduated (100 % of class)').should('have.length', 1)
        cy.contains('1 graduated').trigger('mouseover')
        cy.contains('From class of 2018, 1/undefined students have graduated')
      })

      cy.get('[data-cy="GraduationTimeToggle"]').click()
      cy.get('[data-cy="Section-master"]').within(() => {
        cy.contains('1').click()
        cy.get('div[class="programmes-breakdown-graph"]').should('be.visible')
        cy.get('div[class="programmes-breakdown-graph"]').within(() => {
          cy.contains('Year 2018 by start year')
          cy.contains('EDUM')
        })
      })
    })
  })

  describe('Faculty Progress and student population -tab', () => {
    beforeEach(() => {
      cy.init('/faculties')
      cy.contains('td', 'H50').click()
      cy.contains('Programmes and student populations').click()
    })

    it('User can view studentdata table without %', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', 'NA')
    })
    it('User can view studentdata table with %', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('be.visible')
      cy.get('[data-cy="HidePercentagesToggle"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('contain', 'NA')
    })

    it('Percentage Graphs exists', () => {
      cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyBachelorMastersProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyMastersProgress"]').should('be.visible')
      cy.get('[data-cy="Graph-FacultyBachelorsProgress"]').should('be.visible')
    })
    // Following two tests just test that nothig goes broken after toggling
    // No data for testing that the data actual changes as supposed
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
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-0"]').should('not.be.visible')
      cy.get('[data-cy="Button-Show-FacultyBachelorsProgressTable-0"]').click()
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-0"]').should('be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-1"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-2"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-3"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-4"]').should('not.be.visible')
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-5"]').should('not.be.visible')
      cy.get('[data-cy="Button-Hide-FacultyBachelorsProgressTable-0"]').click()
      cy.get('[data-cy="Cell-FacultyBachelorsProgressTable-0"]').should('not.be.visible')
    })

    it('Sudent statstable can be toggled', () => {
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('not.contain', 'TKT')
      cy.get('[data-cy="Button-FacultyStudentStatsTable-0"]').click()
      cy.get('[data-cy="FacultyStudentStatsTable"]').should('contain', 'TKT')
      cy.get('[data-cy="Button-FacultyStudentStatsTable-0"]').click()
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
