/// <reference types="Cypress" />

describe('Course population tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
          proxy.xhr.setRequestHeader('uid', 'tktl')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    console.log(Cypress.config().baseUrl)
    cy.visit(Cypress.config().baseUrl)
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
    cy.contains('add').click()
    cy.contains('Select students that have grade')

    cy.contains('show').click()
    cy.contains('013614218')
    cy.contains('014022579')
  })

  it('Filters are working', ()=> {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT10004')
    cy.get(':nth-child(2) > .ten > :nth-child(1)').click()
    cy.contains("Fetch statistics").should('be.enabled').click()

    cy.get(':nth-child(2) > :nth-child(1) > div > .item > .level').click()
    cy.contains('Population of course Tietokantojen perusteet 2017-18')
    cy.contains('add').click()
    
    // sex filter
    cy.get('.inline > :nth-child(2) > :nth-child(1) > label').click()
    cy.get(':nth-child(8) > .form > .inline > :nth-child(3) > .ui').click()

    cy.contains('Students (all=100)')
    cy.get(':nth-child(5) > .segment > .selectable > tbody > :nth-child(2) > :nth-child(2)').click()

    cy.contains('Students (all=17)')

    cy.get(':nth-child(6) > .segment > .selectable > tbody > :nth-child(3) > :nth-child(1)').click()
    cy.contains('Tietojenkäsittelytieteen kandiohjelma, KH50_005').should('not.exist')
    cy.contains('Students (all=1)')
  })
})
