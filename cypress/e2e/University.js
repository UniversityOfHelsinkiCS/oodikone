/// <reference types="cypress" />

const progressLevels = ['bachelors', 'bachelor-masters', 'masters', 'doctoral']

const checkProgressBarCharts = () => {
  progressLevels.forEach(level => cy.cs(`faculty-${level}-progress-bar-chart-section`))
}

const checkProgressTables = () => {
  progressLevels.forEach(level => cy.cs(`${level}-faculty-progress-table`))
}

const graduationTimesLevels = ['bachelor', 'master', 'doctor'] // ? Bachelor + master seems to be missing in test data

const checkAverageGraduationTimesBreakdownBarCharts = () => {
  graduationTimesLevels.forEach(level => {
    cy.cs(`${level}-breakdown-bar-chart`)
  })
}

const checkAverageGraduationTimesMedianBarCharts = () => {
  graduationTimesLevels.forEach(level => {
    cy.cs(`${level}-median-bar-chart`)
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

    it("'All study rights / Special study rights excluded' toggle works", () => {
      cy.cs('study-right-toggle').click()
      checkProgressBarCharts()
      checkProgressTables()
    })

    // Nothing in this test is explained. Non of these values are verified.
    it.skip('years in the tables can be clicked to show faculty level breakdown', () => {
      cy.cs('study-right-toggle').click()
      cy.cs('bachelors-faculty-progress-table-show-button3').click()
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
      cy.cs('faculty-progress-info-box-button').click()
      cy.cs('faculty-progress-info-box-content').contains('Kuvaa tiedekuntaan kuuluvien')
      cy.cs('faculty-bachelor-masters-progress-info-box-button').click()
      cy.cs('faculty-bachelor-masters-progress-info-box-content').contains('The starting year is the')
    })
  })

  describe('Faculty graduations tab', () => {
    beforeEach(() => {
      cy.cs('faculty-graduations-tab').click()
    })

    it('has all the correct median time bar charts', () => {
      checkAverageGraduationTimesBreakdownBarCharts()
    })

    it("'Breakdown/Median times' toggle works", () => {
      cy.cs('graduation-time-toggle').click()
      checkAverageGraduationTimesMedianBarCharts()
    })

    it('info boxes contain correct information', () => {
      cy.cs('average-graduation-times-info-box-button').click()
      cy.cs('average-graduation-times-info-box-content').contains('Opiskelijoiden keskimääräiset valmistumisajat')
    })
  })
})
