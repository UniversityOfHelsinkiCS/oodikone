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
    cy.contains('Autumn 2020').click()
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
    cy.contains(teacher1)
  })

  it('Can check teacher page', () => {
    cy.url().should('include', '/teachers')
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type(teacher1.split()[0])
    cy.contains('td', teacher1).click()
    cy.contains('Aineopintojen harjoitustyö: Tietokantasovellus')
  })

  it('Check leaderboad works', () => {
    cy.get('.borderless > :nth-child(2)').click({ force: true })
    cy.get(':nth-child(1) > .ui > .search').click({ force: true })
    cy.contains('2020-2021').click({ force: true })
  })
})
