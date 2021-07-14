/// <reference types="Cypress" />

const deleteTag = name => {
  cy.contains(name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains(name).should('not.exist')
}

describe('Studyprogramme overview', () => {
  beforeEach(() => {
    cy.init()
    cy.contains('Study programme').click().siblings().contains('Overview').click()
    cy.contains('Study Programme', { timeout: 100000 })
  })

  // Taken from https://docs.cypress.io/api/commands/should#Compare-text-values-of-two-elements
  const normalizeText = s => s.replace(/\s/g, '').toLowerCase()
  let originalProgressCalculatedText
  let originalProductivityCalculatedText

  // Following function used by two tests
  const testProgressAndProductivity = () => {
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.contains('Admin').click()
    cy.contains('productivity').click()
    cy.contains('throughput').click()

    cy.wait(1000)
    cy.get('.attached > :nth-child(1)').click()
    cy.get('table').should('have.length', 3)
    cy.contains('Population progress')
    cy.contains('Yearly productivity')

    // Graduation feature is shown for only for devs, these are the values for normal user
    const populationprogress2018 = [
      '160',
      '42 (26%)',
      '118 (73%)',
      '159 (99%)',
      '159',
      '11',
      '11',
      '1',
      '0',
      '150',
      '123',
      '76',
      '41',
      '16',
    ]
    cy.contains('2018-2019')
      .siblings()
      .each((elem, index) => {
        cy.wrap(elem).contains(populationprogress2018[index])
      })
    const populationproductivity2019 = ['7388.0', '17', '7329.00', '59.00', '349.00']
    cy.get('table')
      .eq(1)
      .contains('2019')
      .siblings()
      .each((elem, index) => {
        cy.wrap(elem).contains(populationproductivity2019[index])
      })
  }

  it('progress should not be recalculating when opened for the first time', () => {
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.wait(1000)
    cy.contains('Recalculating').should('not.exist')
  })

  it('renders progress and productivity tables with calculated status', () => {
    testProgressAndProductivity()
    // Wait to "recalculating" to disappear
    cy.wait(1000)
    // Grab update dates to be compared later
    cy.cs('throughputUpdateStatus')
      .invoke('text')
      .then(text => {
        originalProgressCalculatedText = normalizeText(text)
        expect(originalProgressCalculatedText).not.to.contain('recalculating')
        expect(originalProgressCalculatedText).not.to.contain('refresh')
      })

    cy.cs('productivityUpdateStatus')
      .invoke('text')
      .then(text => {
        originalProductivityCalculatedText = normalizeText(text)
        expect(originalProductivityCalculatedText).not.to.contain('recalculating')
        expect(originalProgressCalculatedText).not.to.contain('refresh')
      })
  })

  it('can open Thesis page', () => {
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.contains('Thesis Courses').click()
    cy.contains('Add thesis course').click()
    cy.contains('No results')
  })

  it('can move to Population statistics page by clickin', () => {
    cy.contains('Lääketieteen koulutusohjelma').click()
    cy.get('i.level.up.alternate.icon').eq(0).click()
    cy.contains('Students (121)')
  })

  it('can create and delete tags for population', () => {
    const name = `tag-${new Date().getTime()}`
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached').contains('Tags').click()
    cy.get('.tagNameSelectInput > .ui > input').type(name)
    cy.get('.yearSelectInput').type('2018')
    cy.contains('Create new tag').click()
    cy.contains(name)
    cy.contains('2018')
    deleteTag(name)
  })

  it('can create personal tags', () => {
    const name = `tag-${new Date().getTime()}`
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached').contains('Tags').click()
    cy.get('.tagNameSelectInput > .ui > input').type(name)
    cy.get('.yearSelectInput').type('2018')

    cy.get('.ui > label').click()
    cy.contains('Create new tag').click()
    cy.get('.purple')
    cy.contains(name)
    deleteTag(name)
  })

  it('can add tags to students', () => {
    const name = `tag-${new Date().getTime()}`

    const student = '010113437'

    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.get('.attached').contains('Tags').click()
    cy.get('.tagNameSelectInput > .ui > input').type(name)
    cy.get('.yearSelectInput').type('2018')
    cy.contains('Create new tag').click()
    cy.contains(name)

    cy.contains('Add tags to students').click()
    cy.get('.form > .field > .dropdown').click().get('.ui > .search').type(name).click()

    cy.get('.form > .field > .dropdown > .visible').contains(name).click()

    cy.get('textarea').type('010113437')
    cy.get('.positive').click()

    cy.contains('Student statistics').click()
    cy.get('.prompt').type(student)
    cy.contains(student).click()
    cy.contains(name)

    cy.go('back')
    cy.go('back')

    deleteTag(name)

    cy.contains('Student statistics').click()
    cy.get('.prompt').type(student)
    cy.contains(student).click()
    cy.contains(name).should('not.exist')
  })

  it('renders progress and productivity tables with calculated status after recalculating stats again', () => {
    testProgressAndProductivity()

    // Wait to "recalculating" to disappear
    cy.wait(1000)
    // Check new calculation statuses are reported
    const newProgressCalculatedTextElement = cy.cs('throughputUpdateStatus').invoke('text')
    const newProductivityCalculatedTextElement = cy.cs('productivityUpdateStatus').invoke('text')

    newProgressCalculatedTextElement.should(text => {
      const newProgressCalculatedText = normalizeText(text)
      expect(newProgressCalculatedText).not.to.contain('recalculating')
      expect(newProgressCalculatedText).not.to.contain('refresh')
      expect(newProgressCalculatedText).not.to.contain(originalProgressCalculatedText)
    })

    newProductivityCalculatedTextElement.should(text => {
      const newProductivityCalculatedText = normalizeText(text)
      expect(newProductivityCalculatedText).not.to.contain('recalculating')
      expect(newProductivityCalculatedText).not.to.contain('refresh')
      expect(newProductivityCalculatedText).not.to.contain(originalProgressCalculatedText)
    })
  })
})
