/// <reference types="Cypress" />

const checkFilteringResult = (studentCount, noFiltering = false) => {
  cy.get(".accordion > :nth-child(1)").should("contain", `for ${studentCount} students`)
  cy.cs("active-filter-count").should(noFiltering ? "not.exist" : "exist")
}

describe("Population Statistics", () => {
  before(() => {
    // Tests run considerably faster if we don't init() before each case.
    // Drawback is that cases then rely on the tray being toggled open.
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
})