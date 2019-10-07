
describe('Users tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
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

})
