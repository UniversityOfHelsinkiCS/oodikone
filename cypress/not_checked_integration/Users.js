/// <reference types="Cypress" />

describe('Users tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains("Users").click()
    cy.contains("Oodikone users")
  })

  it("Admin mocking normal user shows only the mocked user's programmes", () => {
    cy.contains("mocking").should('not.exist')
    cy.contains("tr", "Normaalikäyttäjä").within(($row) => {
      cy.contains('.button', 'Edit').click()
    })
    cy.contains("Access rights").siblings().within(($row) => {
      cy.get("div[role='listitem']").should('have.length', 1).contains("Tietojenkäsittelytieteen kandiohjelma")
    })

    cy.route('POST', '/api/superlogin/normk').as('superlogin')
    cy.get('i.spy').click()
    cy.wait('@superlogin')
    cy.contains("mocking as normk")
    cy.wait(1000)
    cy.contains("Study programme").click().siblings().contains("Search by class").click()
    cy.contains("label", "Study programme")
    cy.contains("label", "Study programme").siblings().within(($row) => {
      cy.get("div[role='option']").should('have.length', 1).contains("Tietojenkäsittelytieteen kandiohjelma")
    })

  })

  it("Admin mocking courseStatistics-user can see only Trends and Course Statistics", () => {
    cy.contains("mocking").should('not.exist')
    cy.contains("tr", "User manager").within(($row) => {
      cy.contains('.button', 'Edit').click()
    })

    cy.get("[data-cy=access-groups-form]").click().contains("courseStatistics").click()
    cy.get("[data-cy=access-groups-save]").click()

    cy.route('POST', '/api/superlogin/usermk').as('superlogin')
    cy.get('i.spy').click()
    cy.wait('@superlogin')
    cy.contains("mocking as usermk")
    cy.wait(1000)

    cy.get("[data-cy=navbar-studyProgramme").should('not.exist')
    cy.get("[data-cy=navbar-students]").should('not.exist')
    cy.get("[data-cy=navbar-teachers]").should('not.exist')
    cy.get("[data-cy=navbar-users").should('not.exist')

    cy.contains("Stop mocking").click()
    cy.wait(1000)

    cy.contains("Users").click()
    cy.contains("Oodikone users")
    cy.contains("tr", "User manager").within(($row) => {
      cy.contains('.button', 'Edit').click()
    })
    cy.contains("Access Groups").siblings().within(($row) => {
      cy.get("i[class='dropdown icon clear']").click()
    })
    cy.get("[data-cy=access-groups-save]").click()
  })
})
