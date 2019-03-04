describe('Population Statistics tests', () => {
  Cypress.config('pageLoadTimeout', 100000)

  beforeEach( function () {
    cy.visit("localhost:8081")
    cy.contains("Population statistics").click()
    cy.contains("Select study programme", { timeout: 100000 })
  })
  it('Population statistics search form is usable', () => {
    cy.contains("See population").should('be.disabled')
    cy.url().should('include', '/populations')
    cy.contains("Search for population")
    cy.get(".populationSearchForm__yearSelect___2w98a").as("enrollmentSelect").contains("Enrollment")

    cy.get("@enrollmentSelect").within(() => {
      cy.get("input").its(`${[0]}.value`).then((beforeVal) => {
        cy.get("input").click()
        cy.get("table").contains("2014-2015").click()
        cy.get("input").should('not.have.value', beforeVal)
      })
    })
    cy.contains("Select study programme").click().siblings().contains("Tietojenkäsittelytieteen koulutusohjelma").click()
    cy.contains("Select degree").click().siblings().contains("Luonnontieteiden kandidaatti")
    cy.get(".toggle").click()
    cy.contains("Exchange students")
    cy.contains("See population").should('be.enabled')

  })
})