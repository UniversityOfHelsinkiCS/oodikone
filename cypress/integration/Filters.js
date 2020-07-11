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
    cy.cs("graduatedFromProgrammeFilter-dropdown").click().children(".menu").children().eq(0).click()
    checkFilteringResult(210)
    cy.cs("graduatedFromProgrammeFilter-dropdown").click().children(".menu").children().eq(1).click()
    checkFilteringResult(9)
    cy.cs("graduatedFromProgrammeFilter-clear").click()
    checkFilteringResult(219, true)
  })
})