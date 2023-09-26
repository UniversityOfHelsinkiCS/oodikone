/// <reference types="Cypress" />

describe('Student Statistics tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains('Student statistics').click()
    cy.contains('Show student names')
  })

  const student = {
    firstnames: 'Matti Jaakko',
    lastname: 'Nieminen',
    studentnumber: '010654019',
    sis_person_id: 'hy-hlo-84830887',
  }

  it('Student statistics search form is usable', () => {
    cy.contains('Show student names')
    cy.url().should('include', '/students')
    cy.get('.prompt').type(student.lastname)
    cy.contains('Student number')
    cy.contains('Started')
    cy.contains('Credits')
    cy.contains(student.firstnames).should('not.exist')

    cy.cs('toggleStudentNames').click()
    cy.contains(student.firstnames)

    cy.cs('toggleStudentNames').click()
    cy.contains(student.firstnames).should('not.exist')
  })

  it('can search with studentnumber too', () => {
    cy.get('.prompt').type(student.studentnumber)
    cy.contains(student.studentnumber)
  })

  it('Can get student specific page by clicking student', () => {
    cy.url().should('include', '/students')
    cy.get('.prompt').type(student.studentnumber)
    cy.contains('td a', student.studentnumber).click()
    cy.contains('Started: 01.08.2017')
    cy.contains('Tietojenkäsittelytieteen kandiohjelma (01.08.2017 - 31.07.2025')
    cy.contains(student.lastname).should('not.exist')
    cy.contains(student.firstnames).should('not.exist')

    cy.cs('toggleStudentNames').click()
    cy.contains(student.lastname)
    cy.contains(student.firstnames)

    cy.cs('toggleStudentNames').click()
    cy.contains(student.lastname).should('not.exist')
    cy.contains(student.firstnames).should('not.exist')
  })

  it('Can get back to search menu', () => {
    cy.get('.prompt').type(student.studentnumber)
    cy.contains('td a', student.studentnumber).click()
    cy.get('.remove').click()
    cy.contains('Student number').should('not.exist')
    cy.contains('Credits').should('not.exist')
  })

  it('Can jump to course', () => {
    cy.get('.prompt').type(student.studentnumber)
    cy.contains('td a', student.studentnumber).click()
    cy.contains('Introduction to Machine Learning (DATA11002)')
      .siblings()
      .last()
      .within(() => {
        cy.get('.level').click()
      })
    cy.url().should('include', '/coursestatistics')
    cy.contains('Introduction to Machine Learning')
  })

  it('Has correct Sisu link', () => {
    cy.get('.prompt').type(student.studentnumber)
    cy.contains('td a', student.studentnumber).click()
    cy.get('[data-cy=sisulink] > a')
      .should('have.attr', 'href')
      .and('include', 'https://sisu.helsinki.fi/tutor/role/staff/student/hy-hlo-84830887/basic/basic-info')
  })

  it('Searching with bad inputs doesnt yield results', () => {
    cy.get('.prompt').type('SWAG LITTINEN')
    cy.contains('Student number').should('not.exist')

    cy.get('.prompt').clear().type('01114')
    cy.contains('Student number').should('not.exist')
  })

  it('Can jump to population page', () => {
    cy.get('.prompt').type(student.studentnumber)
    cy.contains('td a', student.studentnumber).click()
    cy.get('i.level.up.alternate.icon').eq(0).click()
    cy.contains('Tietojenkäsittelytieteen kandiohjelma')
    cy.contains('class size')
  })
})

// Use admin to see all students
describe('Testing with admin rights', () => {
  it('Does not crash if student has no studyright or courses', () => {
    const studentNumber = '011825096'
    cy.init(`/students/${studentNumber}`, 'admin') // use admin to see all students
    cy.contains('Started: Unavailable')
    cy.contains('Credits: 0')
  })
})
