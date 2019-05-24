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

  it('can search for course mappings', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Code Mapper').click()
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').get('input').type('582219')
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').get('.results').contains("Käyttöjärjestelmät (582219)")
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').contains('button', "Add")
  })

  it('can view course groups', () => {
    cy.contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains('Course Groups').click()

    cy.contains('tr', 'Test course group').get('i.edit').click()
    cy.contains("Edit group")
    cy.get('.prompt').type("Professori Pekka")
    cy.contains("Add teacher").parent().contains("9000960")
    cy.contains("Teachers in group").parent().contains("9000960")
    cy.get("i.reply.link.icon").click()

    cy.contains('tr a', 'Test course group').click()
    cy.contains("Total teachers")
    cy.get("i.reply.icon").click()
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

  it('can move to Population statistics page by clickin', () => {
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('i.level.up.alternate.icon').eq(0).click()
    cy.contains('Credit accumulation (for 9 students)')
  })
})
