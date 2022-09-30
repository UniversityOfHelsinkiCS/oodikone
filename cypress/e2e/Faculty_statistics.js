/// <reference types="Cypress" />

// Change admin to regular user when feature is ready for general use

describe('Faculty overview', () => {
  describe('Faculty can be selected', () => {
    it('Faculties are listed and one can be chosen', () => {
      cy.init('/faculties', 'admin')
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
      // Fix these when access is gained for facultyStatistics users
      cy.get('[data-cy="FacultySegmentContainer"]').should('not.contain', 'Programmes and student populations')
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
})
