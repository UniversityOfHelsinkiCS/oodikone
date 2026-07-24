/// <reference types="cypress" />

const selectCourseStatus = (courseCode, status) => {
  cy.cs(`courseFilter-${courseCode}-selector`).click()
  cy.get(`[role="listbox"][aria-labelledby=courseFilter-${courseCode}]`).within(() => {
    cy.get('li').contains(status).click()
  })
}

describe('Numbers should match between', () => {
  describe('Programme courses, Course statistics and Course population (no substitutions, all years)', () => {
    const test = [
      // Code, name, total students, passed, not completed, failed*, enrolled no grade* (not used by Programme courses)
      ['Course', 'MAT11001', 'Johdatus yliopistomatematiikkaan', 272, 253, 1 + 18, 1, 18],
      ['Course', 'MAT11003', 'Raja-arvot', 270, 249, 1 + 20, 1, 20],
      ['Course', 'MAT11004', 'Differentiaalilaskenta', 262, 248, 1 + 13, 1, 13],
      ['Course', 'MAT21002', 'Sarjat', 256, 250, 0 + 6, 0, 6],
      ['Course', 'MAT11005', 'Integraalilaskenta', 251, 234, 0 + 17, 0, 17],
      ['Course', 'MAT11002', 'Lineaarialgebra ja matriisilaskenta I', 247, 242, 1 + 4, 1, 4],
      ['Course', 'MAT12003', 'Todennäköisyyslaskenta I', 234, 227, 3 + 4, 3, 4],
      ['Course', 'MAT21001', 'Lineaarialgebra ja matriisilaskenta II', 230, 216, 4 + 10, 4, 10],
      ['Course', 'MAT21003', 'Vektorianalyysi I', 228, 202, 3 + 23, 3, 23],
      ['Course', 'MAT20005', 'Akateemiset taidot', 201, 178, 0 + 23, 0, 23],
      ['Module', 'MAT110', 'Matematiikka, perusopinnot', 195, 195, 0 + 0, 0, 0],
      ['Course', 'MAT21014', 'Johdatus logiikkaan I', 188, 170, 0 + 18, 0, 18],
    ]

    // Check test data is correct
    test.forEach(entry => {
      assert.strictEqual(entry.length, 8)
      assert.strictEqual(entry.at(6) + entry.at(7), entry.at(5))
    })

    it('in Programme courses', () => {
      // Move to Math bachelor programme's programme courses
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('ProgrammeCoursesTab').click()

      // Wait for tab to load
      cy.contains('Programme courses by credit type')

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
                // Failed, Enrolled no grade values not used
                if (fieldIndex <= 5) {
                  cy.get('td').eq(fieldIndex).contains(field)
                }
              })
            })
        })
      })
    })

    it('in Course statistics', () => {
      test.forEach(([_courseOrModule, code, name, total, passed, _notCompleted, failed, enrolledNoGrade]) => {
        // Move to Course statistics
        cy.init(`/coursestatistics?courseCodes=%5B%22${code}%22%5D&combineSubstitutions=false`, 'basic')
        cy.url().should('include', `/coursestatistics?courseCodes=%5B%22${code}%22%5D`)
        cy.contains('Course statistics')
        cy.contains(name) // course name

        cy.cs('FromYearSelector').click()
        cy.cs('FromYearSelectorOption2017-2018').click()

        cy.get('tbody').within(() => {
          cy.get('tr')
            .eq(0)
            .within(() => {
              cy.get('td').eq(1).contains(total)
              cy.get('td').eq(2).contains(passed)
              cy.get('td').eq(3).contains(failed) // jump over combined Not completed
              cy.get('td').eq(4).contains(enrolledNoGrade)
            })
        })
      })
    })

    it('in Course population', () => {
      test.forEach(([_courseOrModule, code, name, total, passed, _notCompleted, failed, enrolledNoGrade]) => {
        // Academic years between 2017-2023
        cy.init(
          // year - 1949 yields the correct year code
          `/coursepopulation?from=${2017 - 1949}&to=${2023 - 1949}&coursecodes=%5B%22${code}%22%5D&includeSubstitutions=false`,
          'basic'
        )
        cy.contains(name) // Course name

        // Select course from Course-filter
        cy.cs('courseFilter-filter-card').click()
        cy.cs('courseFilter-selector').click()
        cy.cs('courseFilter-popper').within(() => {
          cy.contains('li', `${code} - ${name}`).click() // "code - name"
        })

        selectCourseStatus(code, 'All')
        cy.contains(`Students (${total})`)

        selectCourseStatus(code, 'Passed')
        cy.contains(`Students (${passed})`)

        selectCourseStatus(code, 'Failed')
        cy.contains(`Students (${failed})`)

        selectCourseStatus(code, 'Enrolled, No Grade')
        cy.contains(`Students (${enrolledNoGrade})`)
      })
    })
  })

  describe('Programme courses, Course statistics and Course population (no substitutions, single years)', () => {
    // MAT21003, Vektorianalyysi I
    const test = [
      // Year, Total students, Passed, Failed, Enrolled no grade, Not completed (failed + enrolled n.g.)
      [2017, 1, 0, 1, 0, 1 + 0],
      [2018, 31, 27, 4, 0, 4 + 0],
      [2019, 58, 56, 2, 0, 2 + 0],
      [2020, 63, 62, 1, 0, 1 + 0],
      [2021, 41, 35, 0, 6, 0 + 6],
      [2022, 28, 21, 0, 7, 0 + 7],
      [2023, 21, 1, 0, 20, 0 + 20],
    ]

    // Check test data is correct
    test.forEach(entry => {
      assert.strictEqual(entry.length, 6)
      assert.strictEqual(entry.at(3) + entry.at(4), entry.at(5))
    })

    it('in Programme courses', () => {
      cy.init('/study-programme')
      cy.contains('a', 'Matemaattisten tieteiden kandiohjelma').click()
      cy.cs('ProgrammeCoursesTab').click()

      test.forEach(([year, total, passed, _failed, _enrolledNoGrade, notCompleted]) => {
        cy.cs('to-year-select').click()
        cy.cs(`to-year-select-option-${year}`).click()

        cy.cs('from-year-select').click()
        cy.cs(`from-year-select-option-${year}`).click()

        cy.get('tbody')
          .contains('tr', 'MAT21003')
          .scrollIntoView()
          .within(() => {
            cy.get('td').eq(3).contains(total)
            cy.get('td').eq(4).contains(passed)
            cy.get('td').eq(5).contains(notCompleted)
          })
      })
    })

    it('in Course statistics', () => {
      test.forEach(([year, total, passed, failed, enrolledNoGrade, _notCompleted]) => {
        cy.init(`/coursestatistics?courseCodes=%5B%22MAT21003%22%5D&combineSubstitutions=false`, 'basic')

        const yearString = `${year}-${year + 1}`

        cy.cs('ToYearSelector').click()
        cy.cs(`ToYearSelectorOption${yearString}`).click()

        cy.cs('FromYearSelector').click()
        cy.cs(`FromYearSelectorOption${yearString}`).click()

        cy.contains('Student statistics')

        // Check that only total and the selected year are visible
        cy.get('tbody tr').should('have.length', 2)

        // Take the total entry in the table to have enrolled, no grade always be a number
        cy.get('tbody')
          .contains('tr', 'Total')
          .within(() => {
            cy.get('td').eq(1).contains(total)
            cy.get('td').eq(2).contains(passed)
            cy.get('td').eq(3).contains(failed)
            cy.get('td').eq(4).contains(enrolledNoGrade)
          })
      })
    })
    it('in Course population', () => {
      test.forEach(([year, total, passed, failed, enrolledNoGrade, _notCompleted]) => {
        cy.init(
          // year - 1949 yields the correct year code
          `/coursepopulation?from=${year - 1949}&to=${year - 1949}&coursecodes=%5B%22MAT21003%22%5D&includeSubstitutions=false`,
          'basic'
        )
        cy.contains('Vektorianalyysi I') // Course name

        // Select course from Course-filter
        cy.cs('courseFilter-filter-card').click()
        cy.cs('courseFilter-selector').click()
        cy.cs('courseFilter-popper').within(() => {
          cy.contains('li', 'MAT21003 - Vektorianalyysi I').click() // "code - name"
        })

        selectCourseStatus('MAT21003', 'All')
        cy.contains(`Students (${total})`)

        selectCourseStatus('MAT21003', 'Passed')
        cy.contains(`Students (${passed})`)

        selectCourseStatus('MAT21003', 'Failed')
        cy.contains(`Students (${failed})`)

        selectCourseStatus('MAT21003', 'Enrolled, No Grade')
        cy.contains(`Students (${enrolledNoGrade})`)
      })
    })
  })
})
