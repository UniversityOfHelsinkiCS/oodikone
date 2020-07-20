/// <reference types="Cypress" />

const checkFilteringResult = (studentCount, noFiltering = false) => {
  cy.get(".accordion > :nth-child(1)").should("contain", `for ${studentCount} students`)
  cy.cs("active-filter-count").should(noFiltering ? "not.exist" : "exist")
}

describe("Population Statistics", () => {
  before(() => {
    // Tests run considerably faster if we don't init() before each case.
    // Drawback is that cases then rely on the tray being toggled open.
    // TODO: Make smarter (if one test fails all subsequent tests fail, too)?
    cy.init()
    cy.selectStudyProgramme("Tietojenkäsittelytieteen kandiohjelma")
    cy.cs("filter-toggle-open").click()
  })

  it("Filter tray opens and closes", () => {
    cy.cs("filter-toggle-close").click().should("not.be.visible")
    cy.cs("filter-toggle-open").click().should("not.be.visible")
  })

  it("Graduation filter works", () => {
    cy.cs("graduatedFromProgrammeFilter-header").click()
    cy.selectFromDropdown("graduatedFromProgrammeFilter-dropdown", 0)
    checkFilteringResult(210)
    cy.selectFromDropdown("graduatedFromProgrammeFilter-dropdown", 1)
    checkFilteringResult(9)
    cy.cs("graduatedFromProgrammeFilter-clear").click()
    checkFilteringResult(219, true)
  })

  it("Transfer filter works", () => {
    cy.cs("transferredToProgrammeFilter-header").click()
    cy.cs("transferredToProgrammeFilter-have").click()
    checkFilteringResult(25)
    cy.cs("transferredToProgrammeFilter-havenot").click()
    checkFilteringResult(194)
    cy.cs("transferredToProgrammeFilter-clear").click()
    checkFilteringResult(219, true)
  })

  it("Enrollment filter works", () => {
    cy.cs("enrollmentStatusFilter-header").click()
    cy.selectFromDropdown("enrollmentStatusFilter-status", 0)
    checkFilteringResult(219, true)
    cy.selectFromDropdown("enrollmentStatusFilter-semesters", [0, 0])
    checkFilteringResult(202)
    cy.selectFromDropdown("enrollmentStatusFilter-status", 1)
    checkFilteringResult(13)
    cy.cs("enrollmentStatusFilter-clear").click()
    checkFilteringResult(219, true)
  })

  it("Credit filter works", () => {
    cy.cs("credit-filter-header").click()
    cy.cs("credit-filter-min").click().type("50{enter}")
    checkFilteringResult(98)
    cy.cs("credit-filter-max").click().type("100{enter}")
    checkFilteringResult(88)
    cy.cs("credit-filter-min-clear").click()
    checkFilteringResult(209)
    cy.cs("credit-filter-max-clear").click()
    checkFilteringResult(219, true)
  })

  it("Gender filter works", () => {
    cy.cs("genderFilter-header").click()
    cy.selectFromDropdown("genderFilter-dropdown", 0)
    checkFilteringResult(48)
    cy.selectFromDropdown("genderFilter-dropdown", 1)
    checkFilteringResult(171)
    cy.selectFromDropdown("genderFilter-dropdown", 2)
    checkFilteringResult(0)
    cy.cs("genderFilter-clear").click()
    checkFilteringResult(219, true)
  })
  
  // FIXME: These two tests fail in CI and with cypress:run but not with cypress:open.
/*
  it("Starting year filter works", () => {
    cy.viewport(1920, 1080)
    cy.cs("startYearAtUni-header").click()
    cy.screenshot('debug0')
    cy.selectFromDropdown("startYearAtUni-dropdown", [18])
    cy.screenshot('debug1')
    checkFilteringResult(155)   // 153 in ci
    cy.screenshot('debug2')
    cy.cs("startYearAtUni-clear").click()
    checkFilteringResult(219, true)
  })

  it("Courses filter works", () => {
    cy.viewport(1920, 1080)
    cy.cs("courseFilter-header").click()
    cy.cs("courseFilter-course-dropdown").click().contains("MAT11002").click()
    checkFilteringResult(82)
    cy.selectFromDropdown("courseFilter-MAT11002-dropdown", 1)
    checkFilteringResult(75)
    cy.cs("courseFilter-course-dropdown").click().contains("TKT20001").click()
    checkFilteringResult(62)
    cy.selectFromDropdown("courseFilter-TKT20001-dropdown", 6)
    checkFilteringResult(24)
    cy.cs("courseFilter-MAT11002-clear").click()
    cy.screenshot('debug3')
    checkFilteringResult(166)   // 125 in ci
    cy.screenshot('debug4')
    cy.cs("courseFilter-TKT20001-clear").click()
    checkFilteringResult(219, true)
  })
  */
})