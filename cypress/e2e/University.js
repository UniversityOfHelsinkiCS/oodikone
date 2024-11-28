/// <reference types="cypress" />

const progressLevels = ['Bachelors', 'BachelorMasters', 'Masters', 'Doctoral']

const checkProgressBarCharts = () => {
  progressLevels.forEach(level => cy.get(`[data-cy=Faculty${level}ProgressBarChart]`))
}

const checkProgressTables = () => {
  progressLevels.forEach(level => cy.get(`[data-cy=Faculty${level}ProgressTable]`))
}

const graduationTimesLevels = ['bachelor', 'master', 'doctor'] // ? Bachelor + master seems to be missing in test data

const checkAverageGraduationTimesBreakdownBarCharts = () => {
  graduationTimesLevels.forEach(level => {
    cy.get(`[data-cy=${level}BreakdownBarChart]`)
  })
}

const checkAverageGraduationTimesMedianBarCharts = () => {
  graduationTimesLevels.forEach(level => {
    cy.get(`[data-cy=${level}MedianBarChart]`)
  })
}

describe('University view', () => {
  beforeEach(() => {
    cy.init('/university')
    cy.contains('University')
  })

  describe('Faculty progress tab', () => {
    it('contains all the correct progress bar charts', () => {
      checkProgressBarCharts()
    })

    it('contains all the correct progress tables', () => {
      checkProgressTables()
    })

    it("'Graduated included / Graduated excluded' toggle works", () => {
      cy.get('[data-cy=GraduatedToggle]').click()
      checkProgressBarCharts()
      checkProgressTables()
    })

    it("'All study rights / Special study rights excluded' toggle works", () => {
      cy.get('[data-cy=StudyRightToggle]').click()
      checkProgressBarCharts()
      checkProgressTables()
    })

    it('years in the tables can be clicked to show faculty level breakdown', () => {
      cy.get('[data-cy=StudyRightToggle]').click()
      cy.get('[data-cy=FacultyBachelorsProgressTableShowButton3]').click()
      cy.contains('29.5%').trigger('mouseover', { force: true })
      cy.contains('Matemaattis-luonnontieteellinen tiedekunta')
      cy.contains('H50')
      cy.contains('0 Credits: 0')
      cy.contains('1 ≤ Credits < 45: 13')
      cy.contains('45 ≤ Credits < 90: 10')
      cy.contains('90 ≤ Credits < 135: 16')
      cy.contains('135 ≤ Credits < 180: 3')
      cy.contains('180 ≤ Credits: 2')
    })

    it('info boxes contain correct information', () => {
      cy.get('[data-cy=FacultyProgressInfoBoxButton]').click()
      cy.get('[data-cy=FacultyProgressInfoBoxContent]').contains('Kuvaa tiedekuntaan kuuluvien')
      cy.get('[data-cy=FacultyBachelorMastersProgressInfoBoxButton]').click()
      cy.get('[data-cy=FacultyBachelorMastersProgressInfoBoxContent]').contains('The starting year is the')
    })
  })

  describe('Faculty graduations tab', () => {
    beforeEach(() => {
      cy.get('[data-cy=FacultyGraduationsTab]').click()
    })

    it('has all the correct median time bar charts', () => {
      checkAverageGraduationTimesBreakdownBarCharts()
    })

    it("'Breakdown/Median times' toggle works", () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()
      checkAverageGraduationTimesMedianBarCharts()
    })

    it('info boxes contain correct information', () => {
      cy.get('[data-cy=AverageGraduationTimesInfoBoxButton]').click()
      cy.get('[data-cy=AverageGraduationTimesInfoBoxContent]').contains('Opiskelijoiden keskimääräiset valmistumisajat')
    })
  })
})
