/// <reference types="Cypress" />

const setPopStatsUntil = (until, includeSettings = []) => {
  cy.contains('Advanced settings').siblings().get('[data-cy=advanced-toggle]').click()
  includeSettings.forEach(setting => {
    cy.contains('Advanced settings').parent().siblings().contains(setting).click()
  })
  cy.get('.adv-stats-until > .form-control').click().clear().type(until)
  cy.contains('Fetch population with new settings').click()
  cy.contains('Advanced settings')
}

describe('Population Statistics tests', () => {
  const pathToCSBach2017 =
    '/populations?months=36&semesters=FALL&semesters=SPRING&studyRights={%22programme%22%3A%22KH50_005%22}&tag&year=2017'
  describe('when using basic user', () => {
    beforeEach(() => {
      cy.init('/populations')
    })

    it('Population statistics search form is usable', () => {
      cy.contains('See population').should('be.disabled')
      cy.contains('Search for population')
      cy.contains('Class of')
        .parent()
        .within(() => {
          cy.get('.form-control').as('enrollmentSelect')
        })

      cy.get('@enrollmentSelect')
        .its(`${[0]}.value`)
        .then(beforeVal => {
          cy.get('@enrollmentSelect').click()
          cy.get('.yearSelectInput .rdtPrev').click({ force: true })
          cy.get('.yearSelectInput table').contains('2018-2019').click({ force: true })
          cy.get('@enrollmentSelect').should('not.have.value', beforeVal)
        })

      cy.contains('Select study programme')
      cy.get('[data-cy=select-study-programme]')
        .click()
        .children()
        .contains('Tietojenkäsittelytieteen maisteriohjelma')
        .click()
      cy.contains('See population').should('be.enabled')
    })

    it('Searching for population really shows population', () => {
      cy.contains('Select study programme')
      cy.get('[data-cy=select-study-programme]')
        .click()
        .children()
        .contains('Tietojenkäsittelytieteen kandiohjelma')
        .click()
      cy.contains('See population').click()
      cy.contains('Population statistics')
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
    })

    it('Population statistics is usable on general level', () => {
      cy.visit(pathToCSBach2017)
      setPopStatsUntil('toukokuu 2020')

      cy.get('.card').within(() => {
        cy.contains('Tietojenkäsittelytieteen kandiohjelma')
        cy.contains('Sample size: 149 students')
        cy.contains('Excludes exchange students')
        cy.contains("Excludes students who haven't enrolled present nor absent")
        cy.contains('Excludes students with non-degree study right')
        cy.contains('Excludes students who have transferred out of this programme')
      })
      cy.contains('Courses of population').click({ force: true })

      cy.intercept('/api/v3/courseyearlystats**').as('coursePage')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000) // a bit hacky way, wait until ui is ready
      cy.cs('expand-TKT1').click()
      cy.cs('coursestats-link-TKT10002').click()
      cy.wait('@coursePage')
      cy.url().should('include', '/coursestatistics')
      cy.contains('TKT10002, 581325 Ohjelmoinnin perusteet')
    })

    it("Empty 'tags' tab has a link to the page where tags can be created", () => {
      cy.visit(pathToCSBach2017)
      cy.contains('Students (149)').click()
      cy.get('[data-cy=student-table-tabs]').contains('Tags').click()
      cy.contains('No tags defined. You can define them here.').find('a').click()
      cy.contains('Tags').click()
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('Create new tag')
    })

    it('Advanced settings work', () => {
      cy.visit(pathToCSBach2017)
      cy.get('[data-cy=advanced-toggle]').click()
      cy.contains('Statistics until')
      // only spring
      cy.cs('toggle-fall').click()
      cy.contains('Fetch population').click()

      // moar waiting hack
      cy.wait(10000)

      cy.contains('No statistics found for the given query.')

      // only fall
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-fall').click()
      cy.cs('toggle-spring').click()

      cy.contains('Fetch population').click()

      cy.contains('Credit accumulation (for 149 students)')

      // spring + fall and include cancelled
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-spring').click()
      cy.cs('toggle-cancelled').click()
      cy.contains('Fetch population').click()

      cy.contains('Credit accumulation (for 170 students)')
    })

    it('Credit Statistics, Statistics pane works', () => {
      cy.selectStudyProgramme('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('Credit statistics').click()
      cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click()

      cy.get("[data-cy='credit-stats-table-name-header']").should('contain', 'Statistic for n = 149 Students')
      cy.get("[data-cy='credit-stats-mean']").should('contain', '123.89')
      cy.get("[data-cy='credit-stats-stdev']").should('contain', '61.32')
      cy.get("[data-cy='credit-stats-min']").should('contain', '11')
      cy.get("[data-cy='credit-stats-q1']").should('contain', '70')
      cy.get("[data-cy='credit-stats-q2']").should('contain', '129')
      cy.get("[data-cy='credit-stats-q3']").should('contain', '168')
      cy.get("[data-cy='credit-stats-max']").should('contain', '314')
    })
  })

  describe('when using admin', () => {
    beforeEach(() => {
      cy.init(pathToCSBach2017, 'admin')
    })
    it('Student list checking works as intended', () => {
      const existing = '010113437'
      const nonExisting = '66666666'
      cy.visit(pathToCSBach2017)
      cy.contains('Students (149)').click()
      cy.contains(existing)
      cy.contains(nonExisting).should('not.exist')
      cy.contains('button', 'Check studentnumbers').click()
      cy.contains('Check for studentnumbers')
      cy.get('textarea').type(existing).type('{enter}').type(nonExisting)
      cy.contains('button', 'check students').click()
      cy.contains('#checkstudentsresults', 'Results').within(() => {
        cy.contains('Student numbers in list and in oodi').click()
        cy.contains('#found', existing)
        cy.contains('Student numbers in list but not in oodi').click()
        cy.contains('#notfound', nonExisting)
        cy.contains('Student numbers in oodi but not in list').click()
        cy.contains('#notsearched', '010614509')
      })
    })
  })
})
