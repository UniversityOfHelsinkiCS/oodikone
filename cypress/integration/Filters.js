/// <reference types="Cypress" />

const checkFilteringResult = (studentCount, noFiltering = false) => {
  cy.contains(`Students (${studentCount})`)
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

  it("Starting year filter works", () => {
    cy.cs("startYearAtUni-header").click()
    cy.selectFromDropdown("startYearAtUni-dropdown", [16])
    checkFilteringResult(13)
    cy.cs("startYearAtUni-clear").click()
    checkFilteringResult(219, true)
  })

  it("Courses filter works", () => {
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
    checkFilteringResult(125)
    cy.cs("courseFilter-TKT20001-clear").click()
    checkFilteringResult(219, true)
  })
})

describe("Course Statistics", () => {
  before(() => {
    cy.init()
    cy.cs("navbar-courseStatistics").click()
    cy.cs("course-code-input").click().type("TKT20002")
    cy.get(":nth-child(2) > .ten").click()
    cy.cs("fetch-stats-button").click()
    cy.get(":nth-child(2) > :nth-child(1) > div > .item > .level").click()
    cy.cs("filter-toggle-open").click()
  })

  it("Filter tray opens and closes", () => {
    cy.cs("filter-toggle-close").click().should("not.be.visible")
    cy.cs("filter-toggle-open").click().should("not.be.visible")
  })

  /*
  it("Enrollment filter works", () => {
    cy.cs("enrollmentStatusFilter-header").click()
    cy.selectFromDropdown("enrollmentStatusFilter-status", 0)
    checkFilteringResult(93, true)
    cy.selectFromDropdown("enrollmentStatusFilter-semesters", [0, 0])
    checkFilteringResult(92)
    cy.selectFromDropdown("enrollmentStatusFilter-status", 1)
    checkFilteringResult(0)
    cy.cs("enrollmentStatusFilter-clear").click()
    checkFilteringResult(93, true)
  })
  */

  it("Gender filter works", () => {
    cy.cs("genderFilter-header").click()
    cy.selectFromDropdown("genderFilter-dropdown", 0)
    checkFilteringResult(19)
    cy.selectFromDropdown("genderFilter-dropdown", 1)
    checkFilteringResult(74)
    cy.selectFromDropdown("genderFilter-dropdown", 2)
    checkFilteringResult(0)
    cy.cs("genderFilter-clear").click()
    checkFilteringResult(93, true)
  })

  /*
  it("Starting year filter works", () => {
    cy.cs("startYearAtUni-header").click()
    cy.selectFromDropdown("startYearAtUni-dropdown", [0])
    checkFilteringResult(0)
    cy.cs("startYearAtUni-clear").click()
    checkFilteringResult(93, true)
  })
  */

  it("Grade filter works", () => {
    cy.cs("gradeFilter-header").click()
    cy.cs("grade-option-5").click()
    checkFilteringResult(24)
    cy.cs("grade-option-Hyl.").click()
    checkFilteringResult(40)
    cy.cs("gradeFilter-clear").click()
    checkFilteringResult(93, true)
  })
})

describe("Custom Population Statistics", () => {
  before(() => {
    cy.init("custompopulation")
    cy.cs("custom-pop-search-button").click()
    cy.cs("student-no-input").click().type(`
      010182086
      010211504
      010275964
      010328785
      010331154
    `)
    cy.cs("search-button").click()
    cy.cs("filter-toggle-open").click()
  })

  it("Filter tray opens and closes", () => {
    cy.cs("filter-toggle-close").click().should("not.be.visible")
    cy.cs("filter-toggle-open").click().should("not.be.visible")
  })

  it("Gender filter works", () => {
    cy.cs("genderFilter-header").click()
    cy.selectFromDropdown("genderFilter-dropdown", 0)
    checkFilteringResult(2)
    cy.selectFromDropdown("genderFilter-dropdown", 1)
    checkFilteringResult(3)
    cy.selectFromDropdown("genderFilter-dropdown", 2)
    checkFilteringResult(0)
    cy.cs("genderFilter-clear").click()
    checkFilteringResult(5, true)
  })

  it("Starting year filter works", () => {
    cy.cs("startYearAtUni-header").click()
    cy.selectFromDropdown("startYearAtUni-dropdown", [0])
    checkFilteringResult(5)
    cy.cs("startYearAtUni-clear").click()
    checkFilteringResult(5, true)
  })

  /*
  it("Courses filter works", () => {
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
    checkFilteringResult(125)
    cy.cs("courseFilter-TKT20001-clear").click()
    checkFilteringResult(219, true)
  })
  */
})
