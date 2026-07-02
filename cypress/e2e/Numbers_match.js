/// <reference types="cypress" />

describe('Numbers should match between', () => {
  describe('Programme courses and Course statistics', () => {
    const test = [
      // Code, name, total students, passed, not completed
      ['Course', 'MAT11001', 'Johdatus yliopistomatematiikkaan', '272', '253', '19'],
      ['Course', 'MAT11003', 'Raja-arvot', '270', '249', '21'],
      ['Course', 'MAT11004', 'Differentiaalilaskenta', '262', '248', '14'],
      ['Course', 'MAT21002', 'Sarjat', '256', '250', '6'],
      ['Course', 'MAT11005', 'Integraalilaskenta', '251', '234', '17'],
      ['Course', 'MAT11002', 'Lineaarialgebra ja matriisilaskenta I', '247', '242', '5'],
      ['Course', 'MAT12003', 'Todennäköisyyslaskenta I', '234', '227', '7'],
      ['Course', 'MAT21001', 'Lineaarialgebra ja matriisilaskenta II', '230', '216', '14'],
      ['Course', 'MAT21003', 'Vektorianalyysi I', '228', '202', '26'],
      ['Course', 'MAT20005', 'Akateemiset taidot', '201', '178', '23'],
      ['Module', 'MAT110', 'Matematiikka, perusopinnot', '195', '195', '0'],
      ['Course', 'MAT21014', 'Johdatus logiikkaan I', '188', '170', '18'],
    ]

    it('in Programme courses', () => {
      // Move to Math bachelor programme's programme courses
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('ProgrammeCoursesTab').click()

      // Sort by Total students
      cy.get('thead').within(() => {
        cy.get('tr')
          .eq(0)
          .within(() => {
            cy.get('th').eq(3).click()
          })
      })

      cy.get('tbody').within(() => {
        test.forEach((course, index) => {
          cy.get('tr')
            .eq(index)
            .within(() => {
              // Check a course's fields
              course.forEach((field, fieldIndex) => {
                cy.get('td').eq(fieldIndex).contains(field)
              })

              // Course link button, (name is second entry)
              // cy.cs(`${course.at(1).toLocaleLowerCase()}-course-statistics-link-button`).click()
            })
        })
      })
    })

    it('in Course statistics', () => {
      test.forEach(course => {
        // Moved to Course statistics
        cy.visit(`/coursestatistics?courseCodes=%5B%22${course.at(1)}%22%5D&combineSubstitutions=false`)
        cy.url().should('include', `/coursestatistics?courseCodes=%5B%22${course.at(1)}%22%5D`)
        cy.contains('Course statistics')
        cy.contains(course.at(2)) // course name

        cy.cs('FromYearSelector').click()
        cy.cs('FromYearSelectorOption2017-2018').click()

        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(1).contains(course.at(3))
              cy.get('td').eq(2).contains(course.at(4))
              cy.get('td')
                .eq(4)
                .then(failed => {
                  cy.get('td')
                    .eq(5)
                    .then(enrolledNoGrade => {
                      expect(parseInt(failed.text() + parseInt(enrolledNoGrade.text())) === course.at(5))
                    })
                })
            })
        })
      })
    })
  })

  describe('Course statistics and Course population', () => {
    it.skip('when selecting one year')
    it.skip('when selecting the all years')
  })
})
