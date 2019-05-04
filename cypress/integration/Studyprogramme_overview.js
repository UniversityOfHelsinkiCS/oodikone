describe('Studyprogramme overview', () => {
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
    cy.contains("Study programme").click().siblings().contains("Overview").click()
    cy.contains("Study Programme", { timeout: 100000 })
  })

  it('renders progress and productivity tables', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.get('table').should('have.length', 2)
    cy.contains('Population progress')
    cy.contains('Yearly productivity')
    cy.contains("2018-2019").siblings().contains('9')
    cy.contains("2017-2018").siblings().contains('12').siblings().contains('7').siblings().contains('2')
    cy.get('table').eq(1).contains('2018').siblings().contains('443')
    cy.get('table').eq(1).contains('2017').siblings().contains('383')
  })

  it('can search for mandatory courses', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Mandatory Courses').click()
    cy.get('button').contains('Add Courses').click()
    cy.get('input').eq(0).type('CSM')
    cy.contains('Searched courses')
    cy.contains('Code Generation')
  })

  it('can open Thesis page', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Thesis Courses').click()
    cy.contains('Add thesis course').click()
    cy.contains('No results')
  })  
})
