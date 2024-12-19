/// <reference types="cypress" />

const openCompletedCoursesModal = () => {
  cy.contains('button', 'Search completed courses of students').click()
}

const hasLanded = () => {
  cy.contains('Search completed courses')
  cy.contains(
    'Here you can search by a list of student and course numbers to see whether students have completed certain courses yet'
  )
}

const openSearch = () => {
  cy.init('/completedcoursessearch')
  hasLanded()
}

const selectSavedCourselist = name => {
  cy.get('[data-cy=history-search]').click()
  cy.get('[data-cy=history-search]').type(name)
  cy.get('[data-cy=history-search]').type('{downarrow}')
  cy.get('[data-cy=history-search]').type('{enter}')
}

const createCourseList = (courseCodes, courseListName) => {
  openSearch()
  openCompletedCoursesModal()
  cy.get('[data-cy=course-list-input]').type(courseCodes.join('\n'))
  cy.get('[data-cy=search-name]').type(courseListName)
  cy.get('[data-cy=save-courselist]').click()
}

const generateCourseListName = () => `TEST-course-list-${new Date().getTime()}`

const deleteAllPreviousSearches = () => {
  cy.get('[data-cy=history-search]').click()

  cy.get('.MuiAutocomplete-popper li').then($options => {
    if ($options.length > 0) {
      cy.wrap($options).each(($option, index, $list) => {
        cy.wrap($option).click()
        cy.get('[data-cy=delete-courselist]').click()
        if (index < $list.length - 1) {
          cy.get('[data-cy=history-search]').click()
        }
      })
    } else {
      cy.contains('You have no previous searches.')
    }
  })
}

describe('When search modal is opened', () => {
  after(() => {
    cy.init('/completedcoursessearch')
    hasLanded()
    cy.url().should('include', '/completedcoursessearch')
    cy.contains('Search completed courses of students')
    cy.get('[data-cy=open-completed-courses-modal-button]').click()
  })

  it('Modal opens correctly', () => {
    cy.init('/completedcoursessearch')
    hasLanded()
    openCompletedCoursesModal()
    cy.contains('Search completed courses of students')
    cy.contains('Insert one or more student numbers, separated by a space, a newline, a comma, or a semicolon.')
    cy.contains('Insert one or more courses, separated by a space, a newline, a comma, or a semicolon.')
    cy.contains('Insert name for this course list if you wish to save it')
  })

  it('Modal gets the correct course codes and student numbers from the URL', () => {
    cy.init('/completedcoursessearch?courseList=TKT10001&courseList=TKT10002&studentList=433237&studentList=457144')
    hasLanded()
    openCompletedCoursesModal()
    cy.contains('[data-cy=student-no-input]', '433237, 457144')
    cy.contains('[data-cy=course-list-input]', 'TKT10001, TKT10002')
  })

  describe('When a search is executed with invalid input', () => {
    it('Returns empty table and notification', () => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.get('[data-cy=student-no-input]').type('1')
      cy.get('[data-cy=course-list-input]').type('1')
      cy.get('[data-cy=completed-courses-search-button]').click()
      cy.get('[data-cy=rights-notification]').should(
        'contain.text',
        'The information for the following students could not be displayed'
      )
      cy.contains('[data-cy=rights-notification]', '1')
      cy.contains('[data-cy=completed-courses-table-div]', 'Student number')
      cy.contains('[data-cy=completed-courses-table-div]', '1').should('not.exist')
    })
  })

  describe('When a search with correct data is executed', () => {
    beforeEach(() => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        cy.get('[data-cy=student-no-input]').type(studentSet1.join('\n'))
        cy.get('[data-cy=course-list-input]').type(coursesSet1.join('\n'))
        cy.get('[data-cy=completed-courses-search-button]').click()
      })
    })

    it('Pushes the query to url', () => {
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        cy.url().should(
          'include',
          `/completedcoursessearch?courseList=${coursesSet1.join('&courseList=')}&studentList=${studentSet1.join('&studentList=')}`
        )
      })
    })

    it('Finds correct students and courses', () => {
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        for (const studentNumber of studentSet1) {
          cy.contains('[data-cy=completed-courses-table-div]', studentNumber)
        }
        for (const courseCode of coursesSet1) {
          cy.contains('[data-cy=completed-courses-table-div]', courseCode)
        }
      })
    })
  })
})

describe('Courselist saving-related functions work', () => {
  beforeEach(() => {
    openSearch()
    openCompletedCoursesModal()
    cy.get('body').then($body => {
      if ($body.find('[data-cy=history-search]').length > 0) {
        deleteAllPreviousSearches()
      } else {
        cy.contains('You have no previous searches.')
      }
    })
  })

  it('Course list can be saved', () => {
    const courseList = generateCourseListName()
    const courses = ['CSM14204', 'TKT10004']
    createCourseList(courses, courseList)
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.contains('[data-cy=course-list-input]', courses.join(', '))
  })

  it('Course list can be deleted', () => {
    const courseList = generateCourseListName()
    createCourseList(['CSM14204', 'TKT10004'], courseList)
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.get('[data-cy=delete-courselist]').click()
    cy.contains('You have no previous searches.')
  })

  it('Course list can be updated', () => {
    const courseList = generateCourseListName()
    createCourseList(['CSM14204', 'TKT10004'], courseList)
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.get('[data-cy=course-list-input]').type(',TKT10001')
    cy.get('[data-cy=save-courselist]').click()
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.contains('[data-cy=course-list-input]', 'CSM14204, TKT10004, TKT10001')
  })
})
