/// <reference types="Cypress" />

const openCompletedCoursesModal = () => {
  cy.get('button').contains('Search completed courses of students').click()
}

const openSearch = () => {
  cy.init('/completedcoursessearch')
  hasLanded()
}
const selectSavedCourselist = name => {
  cy.get('[data-cy="history-search"]').children().eq(0).type(name).type('{enter}')
}

const hasLanded = () => {
  cy.contains('Search completed courses')
  cy.contains(
    'Here you can search by a list of student and course numbers to see whether students have completed certain courses yet'
  )
}

const deleteAllSearches = () => {
  cy.contains('Saved courselists')
    .get('.dropdown')
    .then(d => {
      const searchItems = d.find('div[role=option] > span[class=text]')
      for (let i = 0; i < searchItems.length; i++) {
        if (searchItems[i].textContent.includes('TEST-')) {
          cy.get('[data-cy="history-search"]').children().eq(0).type(searchItems[i].textContent).type('{enter}')
          cy.get('button').contains('Delete').click()
        }
      }
    })
}

describe('When search modal is opened', { retries: 2 }, () => {
  after(() => {
    cy.init('/completedcoursessearch')
    hasLanded()
    cy.url().should('include', '/completedcoursessearch')
    cy.contains('Search completed courses of students')
    cy.get('[data-cy="open-completed-courses-modal-button"]').click()
    deleteAllSearches()
  })

  it('Modal opens correctly', () => {
    cy.init('/completedcoursessearch')
    hasLanded()
    openCompletedCoursesModal()
    cy.contains('Search completed courses of students')
    cy.contains('Insert one or more student numbers, separated by a space, a newline, a comma, or a semicolon.')
    cy.contains('Insert one or more courses, separated by a space, a newline, or a comma.')
    cy.contains('Insert name for this course list if you wish to save it')
  })

  describe('When a search is executed with invalid input', () => {
    it('Returns empty table and notification', () => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.get('[data-cy="student-no-input"]').type('1')
      cy.get('[data-cy="course-list-input"]').type('1')
      cy.get('[data-cy="completed-courses-search-button"]').click()
      cy.get('[data-cy="rights-notification"]').should(
        'contain.text',
        'The following students information could not be displayed'
      )
      cy.get('[data-cy="rights-notification"]').should('contain.text', '1')
      cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', 'Completed courses search')
      cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', 'Student Number')
      cy.get('[data-cy="completed-courses-table-div"]').should('not.contain', '1')
    })
  })

  describe('When a search with correct data is executed', () => {
    beforeEach(() => {
      cy.init('/completedcoursessearch')
      hasLanded()
      openCompletedCoursesModal()
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        cy.get('[data-cy="student-no-input"]').type(studentSet1.join('\n'))
        cy.get('[data-cy="course-list-input"]').type(coursesSet1.join('\n'))
        cy.get('[data-cy="completed-courses-search-button"]').click()
      })
    })

    it('Pushes the query to url', () => {
      cy.url().should(
        'include',
        '/completedcoursessearch?courseList=TKT10001&courseList=TKT10002&courseList=TKT10003&courseList=TKT10004&studentList=010450938&studentList=010589388&studentList=010614509'
      )
    })

    it('Finds correct students and courses', () => {
      cy.fixture('completedCoursesData').then(({ studentSet1, coursesSet1 }) => {
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', studentSet1[0])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', studentSet1[1])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', studentSet1[2])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', coursesSet1[0])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', coursesSet1[1])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', coursesSet1[2])
        cy.get('[data-cy="completed-courses-table-div"]').should('contain.text', coursesSet1[3])
      })
    })
  })
})

const courseListNames = ['TEST-courselist1', 'TEST-courselist2']

describe('Courselist saving-related functions work', () => {
  beforeEach(() => {
    openSearch()
    openCompletedCoursesModal()
    cy.get('[data-cy="course-list-input"]').type('CSM14204\nTKT10004')
    cy.get('[data-cy="search-name"]').type(courseListNames[0])
    cy.get('button').contains('Save').click()
  })

  it('Course list can be saved', () => {
    selectSavedCourselist(courseListNames[0])
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseListNames[0])
    cy.get('[data-cy="course-list-input"]').contains('TKT10004').contains('CSM14204')
  })

  it('Course list can be deleted', () => {
    openSearch()
    openCompletedCoursesModal()
    cy.get('[data-cy="search-name"]').type(courseListNames[1])
    cy.get('button').contains('Save').click()
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseListNames[1])
    cy.get('button').contains('Delete').click()
    cy.get('[data-cy="history-search"]')
      .type(courseListNames[1])
      .type('{enter}')
      .should('not.contain', courseListNames[1])
  })

  it('Course list can be updated', () => {
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseListNames[0])
    cy.get('[data-cy="course-list-input"]').type(`,TKT10001`)
    cy.get('button').contains('Save').click()
    openSearch()
    openCompletedCoursesModal()
    selectSavedCourselist(courseListNames[0])
    cy.get('[data-cy="course-list-input"]').contains(`TKT10001`)
  })
})
