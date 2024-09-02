/// <reference types="cypress" />

describe('Teachers page tests', () => {
  beforeEach(() => {
    // login as admin = has teacher rights
    cy.init('/teachers', 'admin')
    cy.url().should('include', '/teachers')
  })

  const teacher1 = 'Luokkanen Liisa Viljami'
  const teacher2 = 'Perälä Juhani Susanna'

  it('Check Statistics', () => {
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('Syksy 2020').click()
    cy.cs('course-providers').click()
    cy.contains('Matemaattisten tieteiden kandiohjelma').click()
    cy.cs('course-providers').children('.icon').click()
    cy.contains('button', 'Search').click()
    cy.contains('Teacher')
    const headers = ['Name', 'Credits', 'Credits transferred', 'Passed']
    cy.get('table thead tr th').should('have.length', 4)
    headers.forEach((header, index) => {
      cy.get('table thead tr th').eq(index).should('contain', header)
    })
    cy.contains('td', teacher1).siblings().eq(0).contains('235')
    cy.contains('td', teacher1).siblings().eq(2).contains('97.40%')
    cy.contains('td', teacher2).siblings().eq(0).contains('395')
    cy.contains('td', teacher2).siblings().eq(2).contains('98.78%')
  })

  it('Teacher search works', () => {
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type(teacher1.split(' ')[0])
    cy.get('table tbody tr').should('have.length', 4)
    cy.get('table tbody tr').eq(2).contains('td', teacher1)
  })

  it('Can check teacher page', () => {
    cy.get('.borderless > :nth-child(3)').click()
    cy.get('.prompt').type(teacher2)

    // Prevent opening in new tab
    cy.contains('a', teacher2).invoke('removeAttr', 'target').click()
    cy.url().should('include', '/teachers/hy-hlo-49026530')
    cy.contains(teacher2)
    cy.contains('Syksy 2023').click()
    cy.contains('Kevät 2019').click()
    cy.get('.ok-sortable-table tbody tr')
      .eq(0)
      .within(() => {
        const rowContent = ['MAT12004', 'Tilastollinen päättely I', '120', '0', '92.31%']
        rowContent.forEach((content, index) => {
          cy.get('td').eq(index).contains(content)
        })
      })
  })

  it('Check leaderboad works', () => {
    cy.get('.borderless > :nth-child(2)').click()
    cy.get(':nth-child(1) > .ui > .search').click()
    cy.contains('2020-2021').click()
  })
})
