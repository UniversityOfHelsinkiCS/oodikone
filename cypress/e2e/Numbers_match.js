/// <reference types="cypress" />

const selectCourseStatus = (courseCode, status) => {
  cy.cs(`courseFilter-${courseCode}-selector`).click()
  cy.get(`[role="listbox"][aria-labelledby=courseFilter-${courseCode}]`).within(() => {
    cy.get('li').contains(status).click()
  })
}

describe('Numbers should match between', () => {
  describe('Programme courses, Course statistics and Course population (no substitutions)', () => {
    const test = [
      // Code, name, total students, passed, not completed, failed*, enrolled no grade* (not used by Programme courses)
      ['Course', 'MAT11001', 'Johdatus yliopistomatematiikkaan', '272', '253', (1 + 18).toString(), '1', '18'],
      ['Course', 'MAT11003', 'Raja-arvot', '270', '249', (1 + 20).toString(), '1', '20'],
      ['Course', 'MAT11004', 'Differentiaalilaskenta', '262', '248', (1 + 13).toString(), '1', '13'],
      ['Course', 'MAT21002', 'Sarjat', '256', '250', (0 + 6).toString(), '0', '6'],
      ['Course', 'MAT11005', 'Integraalilaskenta', '251', '234', (0 + 17).toString(), '0', '17'],
      ['Course', 'MAT11002', 'Lineaarialgebra ja matriisilaskenta I', '247', '242', (1 + 4).toString(), '1', '4'],
      ['Course', 'MAT12003', 'Todennäköisyyslaskenta I', '234', '227', (3 + 4).toString(), '3', '4'],
      ['Course', 'MAT21001', 'Lineaarialgebra ja matriisilaskenta II', '230', '216', (4 + 10).toString(), '4', '10'],
      ['Course', 'MAT21003', 'Vektorianalyysi I', '228', '202', (3 + 23).toString(), '3', '23'],
      ['Course', 'MAT20005', 'Akateemiset taidot', '201', '178', (0 + 23).toString(), '0', '23'],
      ['Module', 'MAT110', 'Matematiikka, perusopinnot', '195', '195', (0 + 0).toString(), '0', '0'],
      ['Course', 'MAT21014', 'Johdatus logiikkaan I', '188', '170', (0 + 18).toString(), '0', '18'],
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
                if (fieldIndex <= 5) {
                  // Failed, Enrolled no grade values not used
                  cy.get('td').eq(fieldIndex).contains(field)
                }
              })

              // Course link button, (name is second entry)
              // cy.cs(`${course.at(1).toLocaleLowerCase()}-course-statistics-link-button`).click()
            })
        })
      })
    })

    it('in Course statistics', () => {
      test.forEach(course => {
        // Move to Course statistics
        cy.init(`/coursestatistics?courseCodes=%5B%22${course.at(1)}%22%5D&combineSubstitutions=false`, 'basic')
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
              cy.get('td').eq(3).contains(course.at(6)) // jump over combined Not completed
              cy.get('td').eq(4).contains(course.at(7))
            })
        })
      })
    })

    it('in Course population', () => {
      test.forEach(course => {
        // Academic years between 2017-2023
        cy.init(
          `/coursepopulation?from=68&to=74&coursecodes=%5B%22${course.at(1)}%22%5D&includeSubstitutions=false`,
          'basic'
        )
        cy.contains(course.at(2)) // Course name

        // Select course from Course-filter
        cy.cs('courseFilter-filter-card').click()
        cy.cs('courseFilter-selector').click()
        cy.cs('courseFilter-popper').within(() => {
          cy.contains('li', `${course.at(1)} - ${course.at(2)}`).click() // "code - name"
        })

        selectCourseStatus(course.at(1), 'All')
        cy.contains(`Students (${course.at(3)})`)

        selectCourseStatus(course.at(1), 'Passed')
        cy.contains(`Students (${course.at(4)})`)

        selectCourseStatus(course.at(1), 'Failed')
        cy.contains(`Students (${course.at(6)})`)

        selectCourseStatus(course.at(1), 'Enrolled, No Grade')
        cy.contains(`Students (${course.at(7)})`)
      })
    })
  })

  describe('Course statistics and Course population', () => {
    it.skip('when selecting one year')
    it.skip('when selecting the all years')
  })
})
