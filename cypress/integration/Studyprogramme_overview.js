/// <reference types="Cypress" />

const deleteTag = (name) => {
  cy.contains(name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains(name).should('not.exist')
}

describe('Studyprogramme overview', () => {
  beforeEach(() => {
    cy.init()
    cy.contains("Study programme").click().siblings().contains("Overview").click()
    cy.contains("Study Programme", { timeout: 100000 })
  })

  it('can search for course mappings', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Code Mapper').click()
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').within(($tr) => { cy.get('input').type('582219') })
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').within(($tr) => { cy.get('.results').contains("Käyttöjärjestelmät (582219)") })
    cy.contains('tr', 'TKT20003 Käyttöjärjestelmät').within(($tr) => { cy.contains('button', "Add") })
  })

  it('can view course groups', () => {
    cy.contains("Kasvatustieteiden kandiohjelma").click()
    cy.contains('Course Groups').click()

    cy.contains('tr', 'Test course group').get('i.edit').click()
    cy.contains("Edit group")
    cy.get('.prompt').type("Professori Pekka")
    cy.contains("Add teacher").parent().contains("000960").click()
    cy.contains("Teachers in group").parent().contains("000960")

    cy.get("i.reply.link.icon").click()
    cy.contains('tr a', 'Test course group').click()
    cy.contains("Total teachers")
    cy.get("i.reply.icon").click()
  })

  it('renders progress and productivity tables', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains("Admin").click()
    cy.contains("productivity").click()
    cy.contains("throughput").click()

    cy.wait(1000)
    cy.get('.attached > :nth-child(1)').click()
    cy.get('table').should('have.length', 2)
    cy.contains('Population progress')
    cy.contains('Yearly productivity')
    cy.contains("2017-2018").siblings().contains('228').siblings().contains('178')

    cy.get('table').eq(1).contains('2018').siblings().contains('3023.00').siblings().contains('2631.00')
    cy.get('table').eq(1).contains('2017').siblings().contains('3159.00').siblings().contains("2914.00")
  })

  it('can add and delete mandatory courses and labels', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Mandatory Courses').click()
    cy.get('button').contains('Add Courses').click()
    cy.route('/api/v2/coursesmulti**').as('searchResponse')
    cy.get('input').eq(0).type('Code Generation')
    cy.wait('@searchResponse')
    cy.contains('Searched courses')
    cy.get(':nth-child(1) > .ten').click()
    cy.contains('select label')

    cy.contains('Group labels').click()
    const label = 'cypress test label'
    cy.contains(label).should('not.exist')
    cy.contains('button', 'Add').should('be.disabled')
    cy.get('input').eq(0).type(label)
    cy.contains('button', 'Add').should('be.enabled').click()
    cy.contains('button', 'Add').should('be.disabled')
    cy.contains('table', label)

    cy.contains('Mandatory courses').click()
    cy.get('table').eq(0).contains('tr', 'Code Generation').contains('select label').click()
    cy.contains(label).click()
    cy.get('table').eq(0).contains('tr', 'Code Generation').within((el) => {
      cy.get('div.dropdown>div').eq(0).within((el) => {
        cy.contains('select label').should('not.exist')
        cy.contains(label)
      })
      cy.get('i.clear').click()
      cy.get('div.dropdown>div').eq(0).within((el) => {
        cy.contains(label).should('not.exist')
        cy.contains('select label')
      })
    })
    cy.get('table').eq(0).contains('tr', 'Code Generation').contains('select label').click()
    cy.contains(label).click()
    cy.get('table').eq(0).contains('tr', 'Code Generation').contains('button', 'Delete').click()
    cy.contains('Code Generation').should('not.exist')

    cy.contains('Group labels').click()
    cy.contains('tr', label).within((el) => {
      cy.get('i.remove').click()
    })
    cy.contains('button', 'Remove').click()
    cy.contains(label).should('not.exist')
  })

  it('can open Thesis page', () => {
    cy.contains("Tietojenkäsittelytieteen kandiohjelma").click()
    cy.contains('Thesis Courses').click()
    cy.contains('Add thesis course').click()
    cy.contains('No results')
  })

  it('can move to Population statistics page by clickin', () => {
    cy.contains('Tietojenkäsittelytieteen maisteriohjelma').click()
    cy.get('i.level.up.alternate.icon').eq(0).click()
    cy.contains('Credit accumulation (for 29 students)')
  })

  it('can create and delete tags for population', () => {
    const name = `tag-${new Date().getTime()}`
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached > :nth-child(6)').click()
    cy.get(':nth-child(1) > .field > .ui > input').type(name)
    cy.get('.form-control').type('2018')
    cy.contains('Create new tag').click()
    cy.contains(name)
    cy.contains('2018')
    deleteTag(name)
  })

  it('can create personal tags', () => {
    const name = `tag-${new Date().getTime()}`
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached > :nth-child(6)').click()
    cy.get(':nth-child(1) > .field > .ui > input').type(name)
    cy.get('.form-control').type('2018')
    cy.get('.ui > label').click()
    cy.contains('Create new tag').click()
    cy.get('.purple')
    cy.contains(name)
    deleteTag(name)
  })

  it('can add tags to students', () => {
    const name = `tag-${new Date().getTime()}`

    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached > :nth-child(6)').click()
    cy.get(':nth-child(1) > .field > .ui > input').type(name)
    cy.get('.form-control').type('2018')
    cy.contains('Create new tag').click()
    cy.contains(name)

    cy.contains('Add tags to students').click()
    cy.get('.form > .field > .dropdown').click().get('.ui > .search').type(name).click()
    
    cy.get('.form > .field > .dropdown > .visible').contains(name).click()

    cy.get('textarea').type('010623419')
    cy.get('.positive').click()

    cy.contains('Student statistics').click()
    cy.get('.prompt').type('010623419')
    cy.contains('10').click()
    cy.contains(name)

    cy.go('back')
    cy.go('back')

    deleteTag(name)

    cy.contains('Student statistics').click()
    cy.get('.prompt').type('010623419')
    cy.contains('10').click()
    cy.contains(name).should('not.exist')
  })
})
