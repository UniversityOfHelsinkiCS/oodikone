/// <reference types="Cypress" />

describe('Tag tests', () => {
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
    cy.contains("Study programme").click()
    cy.contains("Overview").click()
    cy.contains("Datatieteen maisteriohjelma").click()
    cy.get('.attached > :nth-child(6)').click()

    cy.get(':nth-child(1) > .field > .ui > input').type('test tag')
    cy.get('.form-control').type('2016')
    cy.contains('Create new tag').click()
    cy.contains('test tag')
    cy.contains('2016')


  })

  it("Tagged population works", () => {
    cy.contains('Add tags to students').click()
    cy.get('.form > .field > .dropdown').click().get('.ui > .search').type('test tag').click()

    cy.get('.form > .field > .dropdown').contains('test tag').click()

    cy.get('textarea').type('014022579\n011122249')
    cy.get('.positive').click()
    cy.get('.level').click()

    cy.contains('Credit accumulation (for 2 students)')
    cy.get(':nth-child(5) > .dividing > :nth-child(1)').click()
    cy.contains('014022579')
    cy.contains('011122249')

    cy.go('back')
    cy.get('tr > :nth-child(3) > .field > .ui').click()
    cy.contains('Are you sure you want to delete tag')
    cy.contains('Confirm').click()
    cy.contains('test tag').should('not.exist')
  })
})