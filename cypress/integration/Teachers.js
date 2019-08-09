
describe('Teachers page tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://localhost:1337/")) {
          proxy.xhr.setRequestHeader('uid', 'tktl')
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

  it("Check Statistics", () => {
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('Autumn 2017').click()
    cy.get('.form > :nth-child(2) > .ui').click()
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.form > .fluid').click()
    cy.contains('Name')
    cy.contains('Wu')
    cy.contains('Jämsä')
    cy.contains('Kuusinen')
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

  it("Check leaderboad works", () => {
    cy.get('.borderless > :nth-child(2)').click()
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('2017-18').click()
    cy.contains("Recalculate this year").click()
    cy.wait(5000)
    cy.reload()
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('2017-18').click()
    cy.contains("Passed")
    cy.contains("Auvinen")
    cy.contains("Ulfvens")
  })
})