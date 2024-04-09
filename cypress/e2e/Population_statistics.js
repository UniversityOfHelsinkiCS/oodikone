/// <reference types="Cypress" />
// Now "Class statistics" in UI
const moment = require('moment')
const _ = require('lodash')

describe('Population Statistics tests', () => {
  const pathToCSBach2017 =
    '/populations?months=36&semesters=FALL&semesters=SPRING&studyRights={%22programme%22%3A%22KH50_005%22}&tag&year=2017'
  const pathToCSMaster2019 =
    '/populations?months=27&semesters=FALL&semesters=SPRING&studyRights=%7B%22programme%22%3A%22MH50_009%22%7D&tag&year=2019'
  describe('when using basic user', () => {
    beforeEach(() => {
      cy.init('/populations')
    })

    it('Population statistics search infobox works', () => {
      cy.get('[data-cy="PopulationSearch-info-content"]').should('not.exist')
      cy.get('[data-cy="PopulationSearch-open-info"]').click()
      cy.get('[data-cy="PopulationSearch-info-content"]').should('be.visible')
      cy.get('[data-cy="PopulationSearch-info-content"]').should(
        'contain',
        'lukuvuosi, jolloin opiskelija on ilmoittautunut'
      )
      cy.get('[data-cy="PopulationSearch-close-info"]').click()
      cy.get('[data-cy="PopulationSearch-info-content"]').should('not.exist')
    })

    it('Population statistics search form is usable', () => {
      cy.contains('See class').should('be.disabled')
      cy.contains('Search for class')
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
      cy.contains('See class').should('be.enabled')
    })

    it('Searching for population really shows population', () => {
      cy.contains('Select study programme')
      cy.get('[data-cy=select-study-programme]')
        .click()
        .children()
        .contains('Tietojenkäsittelytieteen kandiohjelma')
        .click()
      cy.contains('See class').click()
      cy.contains('class size')
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
    })

    it('Population statistics is usable on general level', () => {
      cy.visit(pathToCSBach2017)
      cy.cs('filtered-students')
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('class size 170 students')
      cy.contains('Excludes exchange students')
      cy.contains('Excludes students with non-degree study right')
      cy.contains('Excludes students who have transferred out of this programme')
      cy.cs('filtered-students')
    })

    it('Courses of class is displayed and link to individual course stats page works', () => {
      cy.visit(pathToCSBach2017)
      cy.contains('Courses of class').click()
      cy.intercept('/api/v3/courseyearlystats**').as('coursePage')
      cy.get('[data-cy=toggle-group-module-TKT1]').click()
      cy.contains('td', 'TKT10002').siblings().find('i.level.up').click()
      cy.wait('@coursePage')
      cy.url().should('include', '/coursestatistics')
      cy.contains('TKT10002, 581325, AYTKT10002, A581325 Ohjelmoinnin perusteet')
    })

    it('Courses of class curriculum selection works', () => {
      cy.visit(pathToCSBach2017)
      cy.contains('Courses of class').click()
      cy.get('Opiskelijan digitaidot - Kumpula').should('not.exist')
      cy.get('[data-cy=curriculum-picker]').click()
      cy.contains('2020 - 2022').click()
      cy.contains('Opiskelijan digitaidot - Kumpula')
    })

    it("Empty 'tags' tab has a link to the page where tags can be created", () => {
      cy.visit(pathToCSBach2017)
      cy.contains('Students (170)')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Students (170)').click()
        })
      cy.get('[data-cy=student-table-tabs]').contains('Tags').click()
      cy.contains('No tags defined. You can define them here.').find('a').click()
      cy.contains('Tags').click()
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('Create new tag')
    })

    // This test sometimes fails on headless mode. It seems that the click on the
    // 'Fetch class with new settings' button doesn't always trigger history.push()
    // so the page doesn't reload. This is why waiting also doesn't help.
    it('Advanced settings work', { retries: 2 }, () => {
      cy.visit(pathToCSBach2017)
      cy.get('[data-cy=advanced-toggle]').click()
      // only spring
      cy.cs('toggle-fall').click()
      cy.contains('Fetch class').click()
      cy.contains('Students (0)')
      // only fall
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-fall').click()
      cy.cs('toggle-spring').click()
      cy.contains('Fetch class').click()
      cy.contains('Credit accumulation (for 170 students)')
      // spring + fall
      cy.get('[data-cy=advanced-toggle]').click()
      cy.cs('toggle-spring').click()
      cy.contains('Fetch class').click()
      cy.contains('Credit accumulation (for 170 students)')
    })

    it('Credit Statistics, Credits gained tab works', () => {
      cy.selectStudyProgramme('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('Credit statistics')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Credit statistics').click()
        })
      cy.contains('Credits gained').click()
      cy.get("[data-cy='credits-gained-main-table']").should('contain', 'All students of the class')
      const today = moment().endOf('month')
      const months = Math.round(moment.duration(moment(today).diff(moment('2017-08-01'))).asMonths())
      // Months are capped to goal time of the degree, 36 months is the goal time for bachelor's degree
      const monthsForLimits = Math.min(36, months)
      const limits = [1, ..._.range(1, 5).map(p => Math.ceil(monthsForLimits * ((p * 15) / 12))), null]
      const ranges = _.range(1, limits.length).map(i => _.slice(limits, i - 1, i + 1))

      cy.get('.credits-gained-table').should('contain', '(n = 170)')

      for (const [start, end] of ranges) {
        let value = 'credits'

        if (start !== null) {
          value = `${start} ≤ ${value}`
        }

        if (end !== null) {
          value = `${value} < ${end}`
        }

        cy.get('.credits-gained-table').should('contain', value)
      }

      cy.get("[data-cy='credits-gained-table-body'] td:nth-child(3)").then($els => {
        const sum = [...$els].map($el => parseInt($el.innerText)).reduce((a, b) => a + b, 0)
        expect(sum).to.equal(170)
      })

      cy.get("[data-cy='credits-gained-table-Ei valintatapaa']").should('not.exist')
    })

    it('Credit Statistics, Credits gained tab shows stats by admissions', () => {
      cy.visit(pathToCSMaster2019)
      cy.cs('filtered-students')
      cy.contains('Credit statistics')
      cy.get("[data-cy='Credit statistics']")
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.get("[data-cy='Credit statistics']").click()
        })
      cy.contains('Credits gained').click()
      cy.get('.credits-gained-divider').click()
      cy.get("[data-cy='credits-gained-table-Avoin väylä']").should('exist')
      cy.get("[data-cy='credits-gained-table-Yhteispisteet']").should('exist')
      cy.get("[data-cy='credits-gained-table-Muu']").should('exist')
      cy.get("[data-cy='credits-gained-table-Ei valintatapaa']").should('exist')
    })

    it('Credit Statistics, Statistics pane works', () => {
      cy.selectStudyProgramme('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('Credit statistics')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Credit statistics').click()
        })
      cy.get("[data-cy='credit-stats-tab'] > .menu > :nth-child(2)").click()

      cy.get("[data-cy='credit-stats-table-name-header']").should('contain', 'Statistic for n = 170 Students')
      cy.get("[data-cy='credit-stats-mean']").should('contain', '114.74')
      cy.get("[data-cy='credit-stats-stdev']").should('contain', '65.53')
      cy.get("[data-cy='credit-stats-min']").should('contain', '5')
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
      cy.contains('Students (170)')
        .parent()
        .then($parentDiv => {
          if (!$parentDiv.hasClass('active')) cy.contains('Students (170)').click()
        })
      cy.contains(existing)
      cy.contains(nonExisting).should('not.exist')
      cy.contains('button', 'Check student numbers').click()
      cy.contains('Check for student numbers')
      cy.get('textarea').type(existing).type('{enter}').type(nonExisting)
      cy.contains('button', 'Check students').click()
      cy.contains('#checkstudentsresults', 'Results').within(() => {
        cy.contains('Student numbers in list and in Sisu').click()
        cy.contains('#found', existing)
        cy.contains('Student numbers in list but not in Sodi').click()
        cy.contains('#notfound', nonExisting)
        cy.contains('Student numbers in Sisu but not in list').click()
        cy.contains('#notsearched', '010614509')
      })
    })
  })

  describe('when using IAM user', () => {
    beforeEach(() => {
      cy.init(pathToCSBach2017, 'onlyiamrights')
      cy.contains('Tietojenkäsittelytieteen kandiohjelma')
      cy.contains('class size 170 students')
    })

    it('Population statistics is visible', () => {
      cy.get('.card').within(() => {
        cy.contains('Excludes exchange students')
        cy.contains('Excludes students with non-degree study right')
        cy.contains('Excludes students who have transferred out of this programme')
      })

      cy.contains('Credit accumulation (for 170 students)')
      cy.contains('Credit statistics')
    })

    it('Students tab is not available', () => {
      cy.contains('Students (170)').should('not.exist')
    })
  })
})
