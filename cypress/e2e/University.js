/// <reference types="cypress" />

const levels = ['Bachelors', 'BachelorMasters', 'Masters', 'Doctoral']

const checkProgressGraphs = () => {
  levels.forEach(level => cy.get(`[data-cy=Graph-Faculty${level}Progress]`))
}

const checkProgressTables = () => {
  levels.forEach(level => cy.get(`[data-cy=Table-Faculty${level}Progress]`))
}

const checkAverageGraduationTimesGraphs = breakdown => {
  const levels = ['bachelor', 'bcMsCombo', 'master', 'doctor']
  levels.forEach(level => {
    cy.get(`[data-cy=Section-${level}] .graduations-chart-container .faculty-${breakdown ? 'breakdown-' : ''}graph`)
  })
}

const checkProgressStatsFacultyLevelBreakdown = () => {
  cy.get('[data-cy=Table-FacultyBachelorsProgress]').within(() => {
    cy.contains('2021 - 2022').click()
    cy.contains('29.5%').trigger('mouseover', { force: true })
    cy.contains('Matemaattis-luonnontieteellinen tiedekunta')
    cy.contains('H50 - H50')
    cy.contains('0 Credits: 0')
    cy.contains('1 ≤ Credits < 45: 13')
    cy.contains('45 ≤ Credits < 90: 10')
    cy.contains('90 ≤ Credits < 135: 16')
    cy.contains('135 ≤ Credits < 180: 3')
    cy.contains('180 ≤ Credits: 2')
  })
}

const checkAverageGraduationTimesFacultyLevelBreakdown = breakdown => {
  cy.get('[data-cy=Section-bachelor] .graduations-chart-container').within(() => {
    cy.contains('.graduations-message', "Click a bar to view that year's faculty level breakdown")
    cy.contains(breakdown ? '51' : '141 graduated').click()
    cy.contains('.graduations-message', "Click a bar to view that year's faculty level breakdown").should('not.exist')
    cy.contains(`.programmes-${breakdown ? 'breakdown-' : ''}graph`, 'Year 2021 by graduation year')
  })
}

describe('University view', () => {
  beforeEach(() => {
    cy.init('/university')
    cy.contains('University-level view')
  })

  describe('Progress stats section', () => {
    it('has all the correct progress graphs', () => {
      checkProgressGraphs()
    })

    it('has all the correct progress tables', () => {
      checkProgressTables()
    })

    it("'Graduated included/excluded' toggle works", () => {
      cy.get('[data-cy=GraduatedToggle]').click()
      checkProgressGraphs()
      checkProgressTables()
    })

    it("'All studyrights/Special studyrights excluded' toggle works", () => {
      cy.get('[data-cy=StudentToggle]').click()
      checkProgressGraphs()
      checkProgressTables()
    })

    it('Years in the tables can be clicked to show faculty level breakdown', () => {
      // Filtering out special study rights to make the data match with the Evaluation overview page
      cy.get('[data-cy=StudentToggle]').click()
      checkProgressStatsFacultyLevelBreakdown()
    })
  })

  describe('Average graduation times section', () => {
    it('graphs exist', () => {
      checkAverageGraduationTimesGraphs(true)
    })

    it('Faculty level breakdown can be seen by clicking a bar in the breakdown graph', () => {
      checkAverageGraduationTimesFacultyLevelBreakdown(true)
    })

    it("'Breakdown/Median times' toggle works", () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()
      checkAverageGraduationTimesGraphs(false)
    })

    it('Faculty level breakdown can be seen by clicking a bar in the median times graph', () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()
      checkAverageGraduationTimesFacultyLevelBreakdown(false)
    })
  })
})

// It's better to have these tests defined here than in the 'Evaluation overview' tests as they use the same data as the 'University view' tests
describe("'Evaluation overview' university page", () => {
  beforeEach(() => {
    cy.init('/evaluationoverview/university')
    cy.contains('University-level view')
  })

  it('page opens', () => {
    cy.contains("This view is a combined version of Oodikone's Faculty Evaluation Overview")
  })

  it('has links to faculty evaluation overview pages', () => {
    cy.get('.facultyLinkBox span').should('have.length', 12)
    cy.contains('.facultyLinkBox span a', 'H50 Matemaattis-luonnontieteellinen tiedekunta').click()
    cy.url().should('include', '/evaluationoverview/faculty/H50')
  })

  describe('Progress stats section', () => {
    it('has all the correct progress graphs', () => {
      checkProgressGraphs()
    })

    it('has all the correct progress tables', () => {
      checkProgressTables()
    })

    it("'Graduated included/excluded' toggle works", () => {
      cy.get('[data-cy=GraduatedToggle]').click()
      checkProgressGraphs()
      checkProgressTables()
    })

    it("'All studyrights/Special studyrights excluded' toggle doesn't exist", () => {
      cy.get('.toggle-container [data-cy=StudentToggle]').should('not.exist')
    })

    it('Years in the tables can be clicked to show faculty level breakdown', () => {
      checkProgressStatsFacultyLevelBreakdown()
    })
  })

  describe('Average graduation times section', () => {
    it('graphs exist', () => {
      checkAverageGraduationTimesGraphs(true)
    })

    it('Faculty level breakdown can be seen by clicking a bar in the breakdown graph', () => {
      checkAverageGraduationTimesFacultyLevelBreakdown(true)
    })

    it("'Breakdown/Median times' toggle works", () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()
      checkAverageGraduationTimesGraphs(false)
    })

    it('Faculty level breakdown can be seen by clicking a bar in the median times graph', () => {
      cy.get('[data-cy=GraduationTimeToggle]').click()
      checkAverageGraduationTimesFacultyLevelBreakdown(false)
    })
  })
})
