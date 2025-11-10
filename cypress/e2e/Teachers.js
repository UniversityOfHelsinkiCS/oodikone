/// <reference types="cypress" />

describe('Teachers page tests', () => {
  beforeEach(() => {
    // login as admin = has teacher rights
    cy.init('/teachers', 'admin')
    cy.url().should('include', '/teachers')
  })

  const teacher1 = 'Luokkanen Liisa Viljami'
  const teacher2 = 'Perälä Juhani Susanna'

  const statisticsHeaders = ['Name', 'Credits', 'Credits transferred', 'Passed']

  it('Check Statistics', () => {
    cy.cs('semester-start').click()
    cy.contains('Syksy 2020').click()
    cy.cs('course-providers').click()
    cy.contains('Matemaattisten tieteiden kandiohjelma').click()
    cy.get('body').click(0, 0) // Click outside of the select
    cy.cs('search-statistics').click()

    cy.contains('Teacher')
    cy.get('table thead tr th').should('have.length', 4)
    statisticsHeaders.forEach((header, index) => {
      cy.get('table thead tr th').eq(index).should('contain', header)
    })
    cy.contains('td', teacher1).siblings().eq(0).contains('235')
    cy.contains('td', teacher1).siblings().eq(2).contains('97.40%')
    cy.contains('td', teacher2).siblings().eq(0).contains('395')
    cy.contains('td', teacher2).siblings().eq(2).contains('98.78%')
  })

  it('Teacher search works', () => {
    cy.cs('Search').click()
    cy.cs('teacher-search').type(teacher1.split(' ')[0])
    cy.get('table tbody tr').should('have.length', 4)
    cy.get('table tbody tr').eq(3).contains('td', teacher1)
  })

  it('Can check teacher page', () => {
    cy.cs('Search').click()
    cy.cs('teacher-search').type(teacher2)

    // Prevent opening in new tab
    cy.contains('a', teacher2).invoke('removeAttr', 'target').click()
    cy.url().should('include', '/teachers/hy-hlo-49026530')
    cy.contains(teacher2)
    cy.contains('Syksy 2023').click()
    cy.contains('Kevät 2019').click()
    cy.contains('tr', 'MAT12004').within(() => {
      const rowContent = ['MAT12004', 'Tilastollinen päättely I', '120', '0', '92.31%']
      rowContent.forEach((content, index) => {
        cy.get('td').eq(index).contains(content)
      })
    })
  })

  it('Check leaderboad works', () => {
    cy.cs('Leaderboard').click()
    cy.cs('academic-year').click()
    cy.contains('2020-2021').click()
  })
})
