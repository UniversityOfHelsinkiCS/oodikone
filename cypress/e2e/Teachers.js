/// <reference types="Cypress" />

describe('Teachers page tests', () => {
  beforeEach(() => {
    // login as admin = has teacher rights
    cy.init('/teachers', 'admin')
  })

  const teacher1 = 'Landgraf Leo'
  const teacher2 = 'Vinogradov Jussi Petteri'

  it('Check Statistics', () => {
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('Syksy 2020').click()
    cy.cs('course-providers').click()
    cy.contains('Tietojenkäsittelytieteen kandiohjelma').click()
    cy.cs('course-providers').children('.icon').click()
    cy.get('.form > .fluid').click()
    cy.contains('Teacher')
    cy.contains(teacher1)
    cy.contains(teacher2)
  })

  it('Teacher search works', () => {
    cy.url().should('include', '/teachers')
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type(teacher1.split()[0])
    cy.contains('td', teacher1)
  })

  it('Can check teacher page', () => {
    cy.visit('/teachers/hy-hlo-51367956')
    cy.contains('Landgraf Leo')
    cy.get('.ok-sortable-table tbody tr')
      .first()
      .within(() => {
        cy.contains('td:nth-child(1)', 'TKT20011')
        cy.contains('td:nth-child(2)', 'Aineopintojen harjoitustyö: Tietokantasovellus')
        cy.contains('td:nth-child(3)', '96')
        cy.contains('td:nth-child(4)', '0')
        cy.contains('td:nth-child(5)', '88.89%')
      })
  })

  it('Check leaderboad works', () => {
    cy.get('.borderless > :nth-child(2)').click({ force: true })
    cy.get(':nth-child(1) > .ui > .search').click({ force: true })
    cy.contains('2020-2021').click({ force: true })
  })
})
