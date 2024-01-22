/// <reference types="Cypress" />

describe('Student Statistics tests', () => {
  beforeEach(() => {
    cy.init('/studyguidancegroups', 'admin')
    cy.intercept('/api/studyguidancegroups', { fixture: 'studyGuidanceGroups.json' })
  })

  it('The overview page shows the correct data', () => {
    cy.contains('Study guidance groups')

    const attemptsTableContents = [
      ['TKT kandit 2018', 3, 'Tietojenkäsittelytieteen kandiohjelma', '2018 - 2019'],
      ['Oma ohjausryhmä', 2, 'Add study programme', 'Add year'],
    ]

    cy.checkTableStats(attemptsTableContents, 'study-guidance-group-overview')
  })

  it('The single group page shows the correct data', () => {
    cy.cs('study-guidance-group-link-sgg-cypress-1').click()
    cy.contains('TKT kandit 2018')
    cy.contains('Tietojenkäsittelytieteen kandiohjelma')
    cy.contains('2018 - 2019')
    cy.contains('Credit accumulation (for 3 students)')
  })
})
