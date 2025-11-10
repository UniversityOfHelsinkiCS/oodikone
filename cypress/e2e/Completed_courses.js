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
  cy.cs('history-search').click()
  cy.cs('history-search').type(name)
  cy.cs('history-search').type('{downarrow}')
  cy.cs('history-search').type('{enter}')
}

const createCourseList = (courseCodes, courseListName) => {
  openSearch()
  openCompletedCoursesModal()
  cy.cs('course-list-input').type(courseCodes.join('\n'))
  cy.cs('search-name').type(courseListName)
  cy.cs('save-courselist').click()
}

const generateCourseListName = () => `TEST-course-list-${new Date().getTime()}`

const deleteAllPreviousSearches = () => {
  cy.cs('history-search').click()

  cy.get('.MuiAutocomplete-popper li').then($options => {
    if ($options.length > 0) {
      cy.wrap($options).each(($option, index, $list) => {
        cy.wrap($option).click()
        cy.cs('delete-courselist').click()
        if (index < $list.length - 1) {
          cy.cs('history-search').click()
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
    cy.cs('open-completed-courses-modal-button').click()
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
    cy.cs('student-no-input').contains('433237, 457144')
    cy.cs('course-list-input').contains('TKT10001, TKT10002')
  })

  describe('When a search is executed with invalid input', () => {
    it('Returns empty table and notification', () => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.cs('student-no-input').type('1')
      cy.cs('course-list-input').type('1')
      cy.cs('completed-courses-search-button').click()
      cy.cs('rights-notification').should(
        'contain.text',
        'The information for the following students could not be displayed'
      )
      cy.cs('rights-notification').contains('1')
      cy.cs('completed-courses-table-div').contains('Student number')
      cy.cs('completed-courses-table-div').contains('1').should('not.exist')
    })
  })

  describe('When a search with correct data is executed', () => {
    beforeEach(() => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        cy.cs('student-no-input').type(studentSet1.join('\n'))
        cy.cs('course-list-input').type(coursesSet1.join('\n'))
        cy.cs('completed-courses-search-button').click()
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
          cy.cs('completed-courses-table-div').contains(studentNumber)
        }
        for (const courseCode of coursesSet1) {
          cy.cs('completed-courses-table-div').contains(courseCode)
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
    cy.cs('course-list-input').contains(courses.join(', '))
  })

  it('Course list can be deleted', () => {
    const courseList = generateCourseListName()
    createCourseList(['CSM14204', 'TKT10004'], courseList)
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.cs('delete-courselist').click()
    cy.contains('You have no previous searches.')
  })

  it('Course list can be updated', () => {
    const courseList = generateCourseListName()
    createCourseList(['CSM14204', 'TKT10004'], courseList)
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.cs('course-list-input').type(',TKT10001')
    cy.cs('save-courselist').click()
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseList)
    cy.cs('course-list-input').contains('CSM14204, TKT10004, TKT10001')
  })
})
