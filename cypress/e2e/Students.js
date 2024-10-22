/// <reference types="cypress" />

const student = {
  firstnames: 'Varpu Roope',
  lastname: 'Mårtensson',
  studentnumber: '550003',
  sis_person_id: 'hy-hlo-115926826',
  email: 'sisutestidata134902@testisisudata.fi',
}

const typeStudentNumberAndClick = studentNumber => {
  cy.get('.prompt').type(studentNumber)
  cy.contains('td a', studentNumber).click()
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
      typeStudentNumberAndClick(student.studentnumber)
      cy.get('div.ui.fluid.card').within(() => {
        cy.contains('button', 'Update student').should('not.exist')
      })
    })

    it('Can get back to search menu', () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.go('back')
      cy.contains('Student number').should('not.exist')
      cy.contains('Credits').should('not.exist')
    })

    it('Can jump to course', () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.contains('Tilastollinen päättely I (MAT12004)')
        .parent()
        .siblings()
        .last()
        .within(() => {
          cy.get('.level').click()
        })
      cy.url().should('include', '/coursestatistics')
      cy.contains('MAT12004 Tilastollinen päättely I')
      cy.contains('AYMAT12004 Avoin yo: Tilastollinen päättely I')
      cy.contains('57046 Johdatus tilastolliseen päättelyyn')
    })

    it('Has correct Sisu link', () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.get('[data-cy=sisulink] > a')
        .should('have.attr', 'href')
        .and('include', `https://sisu.helsinki.fi/tutor/role/staff/student/${student.sis_person_id}/basic/basic-info`)
    })

    it('Semester enrollments can be toggled', () => {
      typeStudentNumberAndClick(student.studentnumber)
      const programmes = [
        'Oikeustieteen tohtoriohjelma',
        'Matemaattisten tieteiden kandiohjelma',
        'Oikeustieteen maisterin koulutusohjelmaOikeusnotaarin koulutusohjelma',
      ]
      cy.get('div.ui.fluid.card').within(() => {
        cy.contains('Enrollments').click()
        cy.get('table tbody tr')
          .should('have.length', 3)
          .each(($tr, index) => {
            cy.wrap($tr).within(() => {
              cy.get('td').eq(0).should('have.text', programmes[index])
            })
          })
      })
    })

    it('Searching with bad inputs doesnt yield results', () => {
      cy.get('.prompt').type('SWAG LITTINEN')
      cy.contains('Student number').should('not.exist')

      cy.get('.prompt').clear().type('01114')
      cy.contains('Student number').should('not.exist')
    })

    it('Can jump to population page', () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.contains('.ui.table', 'Completed').within(() => {
        cy.get('i.level.up.alternate.icon').click()
      })
      cy.contains('Matemaattisten tieteiden kandiohjelma 2020 - 2021')
      cy.contains('class size 30 students')
    })

    it('Grade graph works in all three different modes', () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.contains('a.item', 'Grade graph').click()
      cy.contains('text.highcharts-title', 'Grade plot')
      cy.contains('a.item', 'Show group mean').click()
      cy.get('.labeled.input').within(() => {
        cy.contains('.label', 'Group size')
        cy.get('input').should('have.value', '5')
      })
      cy.contains('.highcharts-container text', "Nov '22")
      cy.contains('.highcharts-container text', "Jul '22").should('not.exist')
      cy.contains('text.highcharts-title', 'Grade plot')
      cy.get('.labeled.input').within(() => {
        cy.contains('.label', 'Group size')
        cy.get('input').clear().type('10')
        cy.get('input').should('have.value', '10')
      })
      cy.contains('.highcharts-container text', "Jul '22")
      cy.contains('.highcharts-container text', "Nov '22").should('not.exist')
      cy.contains('a.item', 'Show semester mean').click()
      cy.contains('.highcharts-container text', "Jan '22")
    })

    describe('Bachelor Honours section', () => {
      it("Shows 'Qualified for Honours' tag and main modules info when the student is qualified", () => {
        cy.visit('/students/495976')
        cy.contains('.divider h4', 'Bachelor Honours')
        cy.contains('.green.tag.label', 'Qualified for Honours')
        cy.contains('Main courses and other modules').click()
        cy.get('[data-cy=main-modules] tbody tr')
          .should('have.length', 3)
          .each(($tr, index) => {
            const info = [
              ['07.05.2020', 'Matemaattisten tieteiden kandiohjelma (KH50_001)', 'Hyv.'],
              ['08.05.2018', 'Matematiikka, perusopinnot (MAT110)', '4'],
              ['25.02.2020', 'Matematiikka, aineopinnot (MAT210)', '4'],
            ]
            cy.wrap($tr).within(() => {
              info[index].forEach((text, i) => {
                cy.get('td').eq(i).contains(text)
              })
            })
          })
      })

      it("Shows 'Did not graduate in time' when the student has graduated but not in time", () => {
        cy.visit('/students/540355')
        cy.contains('.divider h4', 'Bachelor Honours')
        cy.contains('.red.tag.label', 'Not qualified for Honours')
        cy.contains('.red.tag.label', 'Did not graduate in time')
      })

      it("Shows 'Module grades too low' when the student has graduated in time but has too low grades", () => {
        cy.visit('/students/547934')
        cy.contains('.divider h4', 'Bachelor Honours')
        cy.contains('.red.tag.label', 'Not qualified for Honours')
        cy.contains('.red.tag.label', 'Module grades too low')
      })

      it("Shows 'Might need further inspection' when the student has graduated in time but has more than four main modules", () => {
        cy.visit('/students/478837')
        cy.contains('.divider h4', 'Bachelor Honours')
        cy.contains('.blue.tag.label', 'Might need further inspection')
      })

      it("Shows 'Has not graduated' when the student has not graduated", () => {
        cy.visit(`students/${student.studentnumber}`)
        cy.contains('.divider h4', 'Bachelor Honours')
        cy.contains('.red.tag.label', 'Not qualified for Honours')
        cy.contains('.red.tag.label', 'Has not graduated')
      })
    })
  })

  // Use admin to see all students
  describe('when using admin user', () => {
    beforeEach(() => {
      cy.init('/students', 'admin')
    })

    it('Does not crash if student has no studyright or courses', () => {
      typeStudentNumberAndClick('450730')
      cy.contains('Credits: 0')
    })

    it("'Update student' button is shown", () => {
      typeStudentNumberAndClick(student.studentnumber)
      cy.get('div.ui.fluid.card').within(() => {
        cy.contains('button', 'Update student')
      })
    })

    it('Bachelor Honours section is not shown for students outside of Faculty of Science', () => {
      cy.visit('/students/453146')
      cy.contains('.divider h4', 'Bachelor Honours').should('not.exist')
    })

    it('When a study plan is selected, courses included in the study plan are highlighted with a blue background', () => {
      cy.visit('/students/550789')
      cy.contains('table tbody tr', 'Kulttuurien tutkimuksen kandiohjelma (01.08.2020–30.06.2023)').within(() => {
        cy.get('td').eq(0).click()
      })
      cy.contains('table tbody tr', 'Kandidaatintutkielma (KUKA-LIS222)')
        .should('have.attr', 'style')
        .and('equal', 'background-color: rgb(232, 244, 255);')
    })

    it('When a study plan is selected, the time frame of the credit graph is updated', () => {
      cy.clock(new Date('2024-08-30').getTime(), ['Date'])
      cy.visit('/students/550789')
      cy.contains('.highcharts-container text', '1 Aug 2020')
      cy.contains('.highcharts-container text', '30 Aug 2024')
      cy.contains('table tbody tr', 'Kulttuurien tutkimuksen kandiohjelma (01.08.2020–30.06.2023)').within(() => {
        cy.get('td').eq(0).click()
      })
      cy.contains('.highcharts-container text', '1 Aug 2020')
      cy.contains('.highcharts-container text', '19 Aug 2023')
    })

    it("If there's a study plan corresponding to the degree programme, completed credits are displayed", () => {
      cy.visit('/students/550789')
      cy.contains('table tbody tr', 'Kulttuurien tutkimuksen kandiohjelma (01.08.2020–30.06.2023)').within(() => {
        cy.get('td')
          .eq(-1)
          .contains(/^185 cr$/)
      })
    })

    it("If there's a study plan corresponding to the degree programme and the student hasn't graduated, percentage of completion is also displayed", () => {
      cy.visit('/students/458723')
      cy.contains('table tbody tr', 'Oikeusnotaarin koulutusohjelma (01.08.2020–31.07.2027)').within(() => {
        cy.get('td').eq(-1).contains('69% (125 cr)')
      })
    })
  })
})
