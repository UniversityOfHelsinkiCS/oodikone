
describe('Teachers page tests', () => {
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
    cy.visit(Cypress.config().baseUrl)
    cy.reload()
    cy.contains("Teachers").click()
    cy.contains("Teacher statistics by course providers")
  })

  it("Teacher search works", () => {
    cy.url().should('include', '/teachers')
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type('Pekka')
    cy.contains('Professori Pekka')
    cy.contains('Saren')
    cy.contains('Jari')
    cy.contains('Lopez')
  })

  it("Can check teacher page", () => {
    cy.url().should('include', '/teachers')
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type('Pekka')
    cy.contains('Saren').click()
    cy.contains('English Academic & Professional Skills: Reading, Writing & Spoken Communication (CEFR B2)*')
  })

  it("Can check teacher page if teacher doesn't have courses", () => {
    cy.url().should('include', '/teachers')
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type('Pekka')
    cy.contains('Professori').click()
    cy.contains('Name').should('not.exist')
  })
})