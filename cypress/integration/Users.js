
describe('Users tests', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl)
    cy.get(".world").parent().click().contains('fi').click()
  })

  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://localhost:1337/")) {
          proxy.xhr.setRequestHeader('uid', 'admink')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    console.log(Cypress.config().baseUrl)
    cy.visit(Cypress.config().baseUrl)
    cy.reload()
    cy.contains("Users").click()
    cy.contains("Enable or disable access to Oodikone")
  })

  it("Admin mocking normal user shows only the mocked user's programmes", () => {
    cy.contains("mocking").should('not.exist')
    cy.contains("tr", "Normaalikäyttäjä").within(($row) => {
      cy.contains('button', 'Edit').click()
    })
    cy.contains("Access rights").siblings().within(($row) => {
      cy.get("div[role='listitem']").should('have.length', 1).contains("Tietojenkäsittelytieteen kandiohjelma")
    })

    cy.get('i.spy').click()
    cy.contains("mocking as normk")
    cy.wait(1000)
    cy.contains("Study programme").click().siblings().contains("Search by class").click()
    cy.contains("label", "Study programme")
    cy.contains("label", "Study programme").siblings().within(($row) => {
      cy.get("div[role='option']").should('have.length', 1).contains("Tietojenkäsittelytieteen kandiohjelma")
    })
  })

})
