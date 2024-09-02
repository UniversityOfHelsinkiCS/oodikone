/// <reference types="cypress" />

const openCustomPopupForm = () => {
  cy.get('[data-cy="custom-pop-search-button"]').click()
}

const fillName = () => {
  const name = `TEST-${new Date().getTime()}`
  cy.contains('Insert name for this custom population if you wish to save it')
  cy.get('[data-cy="custom-population-name-input"]').type(name)
  return name
}

const save = () => {
  cy.get('button').contains('Save').click()
}

const selectSavedPopulation = name => {
  cy.get('[data-cy="history-search"]').children().eq(0).type(`${name}{enter}`)
}

const deleteAllSearches = () => {
  cy.get('[data-cy="history-search"]').children().eq(0).click()
  cy.contains('Saved populations')
    .parent()
    .parent()
    .parent()
    .parent()
    .get('.dropdown')
    .then(dropdown => {
      const searchItems = dropdown.find('div[role=option] > span[class=text]')
      for (let i = 0; i < searchItems.length; i++) {
        if (searchItems[i].textContent.includes('TEST-')) {
          cy.get('[data-cy="history-search"]').children().eq(0).type(`${searchItems[i].textContent}{enter}`)
          cy.get('button').contains('Delete').click()
        }
      }
    })
}

const fillForm = (content, separator) => {
  cy.get('[data-cy="student-number-input"]').type(content.join(separator))
}

const search = () => {
  cy.get('[data-cy="search-button"]').click()
}

const searchFor = (studentnumbers, separator) => {
  openCustomPopupForm()
  fillForm(studentnumbers, separator)
  search()
}

const hasLanded = () => {
  cy.contains('Credit accumulation')
  cy.contains('Programme distribution')
  cy.contains('Courses of population')
  cy.contains('Students')
}

const containsAmountOfStudents = (amount = 0) => {
  cy.contains(`Credit accumulation (for ${amount} students)`)
}

const containsSpecificStudents = (studentnumbers = []) => {
  cy.contains(`Students (${studentnumbers.length})`).click()

  studentnumbers.forEach(s => cy.contains(s))
}

const checkRightsNotification = studentNumbers => {
  cy.get('[data-cy="rights-notification"]').within(() => {
    cy.contains(
      'The following students information could not be displayed. This could be either because they do not exist, or you do not have the right to view their information.'
    )
    cy.get('ul').within(() => {
      studentNumbers.forEach(number => cy.get('li').contains(number))
    })
  })
}

describe('Custom population tests', () => {
  const nonExistentStudentNumbers = ['123', 'X', '-']
  beforeEach(() => {
    cy.init('/custompopulation')
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
  })

  after(() => {
    cy.visit('/custompopulation')
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
    cy.get('button').contains('Custom population').click()
    deleteAllSearches()
  })

  describe('Custom population searching', () => {
    it('Finds a proper population', () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        searchFor(students, '\n')
        hasLanded()
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)
      })
    })

    it("Doesn't return non-existing students", () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        searchFor([...students, ...nonExistentStudentNumbers], ' ')
        hasLanded()
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)
        checkRightsNotification(nonExistentStudentNumbers)
      })
    })

    it("Doesn't find empty custom population", () => {
      searchFor(nonExistentStudentNumbers, ',')
      checkRightsNotification(nonExistentStudentNumbers)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Custom population')
    })

    it("Doesn't return students user has no right to", () => {
      // These students exist in the database, but the user doesn't have the right to view them
      const studentsForEduBachStudents = ['014990067', '013069465', '014853890']
      // Two semicolons on purpose, the page should be able to handle it
      searchFor(studentsForEduBachStudents, ';;')
      checkRightsNotification(studentsForEduBachStudents)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Custom population')
    })
  })

  describe('Custom population search saving', () => {
    it('Saves a custom population search', { retries: 2 }, () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        openCustomPopupForm()
        cy.contains(
          'Insert student numbers you wish to use for population. Separate each number with a comma, semicolon, space, or newline.'
        )
        const name = fillName()
        // A comma and a newline on purpose, the page should be able to handle it
        fillForm(students, ',\n')
        save()

        // Round 1
        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)

        // Round 2
        cy.visit('/custompopulation')
        cy.contains('Custom population')
        openCustomPopupForm()
        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)
      })
    })

    it('Updates a custom population search', () => {
      cy.fixture('customPopulations').then(
        ({ studentNumbersForCSStudentsSet1: students1, studentNumbersForCSStudentsSet2: students2 }) => {
          openCustomPopupForm()
          const name = fillName()
          fillForm(students1, ' ')
          save()

          selectSavedPopulation(name)
          search()
          cy.contains(`Custom population "${name}"`)
          containsAmountOfStudents(students1.length)
          containsSpecificStudents(students1)
          cy.contains('Custom population')
          openCustomPopupForm()
          selectSavedPopulation(name)
          fillForm(['\n', ...students2], ', ')
          save()

          cy.visit('/custompopulation')
          cy.contains('Custom population')
          openCustomPopupForm()
          selectSavedPopulation(name)
          search()
          cy.contains(`Custom population "${name}"`)
          containsAmountOfStudents(students1.length + students2.length)
          containsSpecificStudents([...students1, ...students2])
        }
      )
    })
  })
})
