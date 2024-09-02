/// <reference types="cypress" />

const student = {
  firstnames: 'Varpu Roope',
  lastname: 'Mårtensson',
  studentnumber: '550003',
  sis_person_id: 'hy-hlo-115926826',
  email: 'sisutestidata134902@testisisudata.fi',
}

describe('Students tests', () => {
  describe('when using basic user', () => {
    beforeEach(() => {
      cy.init()
      cy.contains('Students').click()
      cy.url().should('include', '/students')
      cy.contains('Show student names')
    })

    it('Students search form is usable', () => {
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

    it('Search term must be at least 4 characters long', () => {
      cy.get('.prompt').type(student.lastname.slice(0, 3))
      cy.contains('No search results or search term is not accurate enough')
      cy.get('.prompt').type(student.lastname.slice(3))
      cy.get('table tbody tr').should('have.length', 1)
    })

    it('can search with studentnumber too', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains(student.studentnumber)
    })

    it('Can get student specific page by clicking student', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.contains('Matemaattisten tieteiden kandiohjelma (01.08.2020–31.07.2027)')
      cy.contains(student.lastname).should('not.exist')
      cy.contains(student.firstnames).should('not.exist')
      cy.contains(student.email).should('not.exist')

      cy.cs('toggleStudentNames').click()
      cy.contains(student.lastname)
      cy.contains(student.firstnames)
      cy.contains(student.email)

      cy.cs('toggleStudentNames').click()
      cy.contains(student.lastname).should('not.exist')
      cy.contains(student.firstnames).should('not.exist')
      cy.contains(student.email).should('not.exist')
    })

    it("'Update student' button is not shown", () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.get('div.ui.fluid.card').within(() => {
        cy.contains('button', 'Update student').should('not.exist')
      })
    })

    it('Can get back to search menu', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.go('back')
      cy.contains('Student number').should('not.exist')
      cy.contains('Credits').should('not.exist')
    })

    it('Can jump to course', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.contains('Tilastollinen päättely I (MAT12004)')
        .parent()
        .siblings()
        .last()
        .within(() => {
          cy.get('.level').click()
        })
      cy.url().should('include', '/coursestatistics')
      cy.contains('MAT12004, 57046, AYMAT12004 Tilastollinen päättely I')
    })

    it('Has correct Sisu link', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.get('[data-cy=sisulink] > a')
        .should('have.attr', 'href')
        .and('include', `https://sisu.helsinki.fi/tutor/role/staff/student/${student.sis_person_id}/basic/basic-info`)
    })

    it('Bachelor Honours section is shown', () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.contains('h4', 'Bachelor Honours')
      cy.contains('.tag.label', 'Not qualified for Honours')
      cy.contains('.tag.label', 'Has not graduated')
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
      cy.contains('.ui.table', 'Completed').within(() => {
        cy.get('i.level.up.alternate.icon').click()
      })
      cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
      cy.contains('class size 30 students')
    })
  })

  // Use admin to see all students
  describe('when using admin user', () => {
    beforeEach(() => {
      cy.init('/students', 'admin')
    })

    it('Does not crash if student has no studyright or courses', () => {
      const studentNumber = '450730'
      cy.get('.prompt').type(studentNumber)
      cy.contains('td a', studentNumber).click()
      cy.contains('Credits: 0')
    })

    it("'Update student' button is shown", () => {
      cy.get('.prompt').type(student.studentnumber)
      cy.contains('td a', student.studentnumber).click()
      cy.get('div.ui.fluid.card').within(() => {
        cy.contains('button', 'Update student')
      })
    })
  })
})
