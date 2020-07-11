/// <reference types="Cypress" />

describe('Course population tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains("Course statistics").click()
    cy.contains("Search for courses")
  })

  it('Can find course population', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT20003')
    cy.contains("tr", "TKT20003").click()
    cy.contains("Fetch statistics").should('be.enabled').click()

    cy.contains("Käyttöjärjestelmät")
    cy.contains("TKT20003")

    cy.get(':nth-child(3) > :nth-child(1) > div > .item > .level').click()
    cy.contains('Population of course Käyttöjärjestelmät 2017-18')
    cy.contains('TKT20003, 582219, 582640, 582497')
    cy.contains('Students (all=39)')

    cy.contains('Students (39)').click()
    cy.contains('013614218')
    cy.contains('014022579')
  })
})
