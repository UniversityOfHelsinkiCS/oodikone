/// <reference types="Cypress" />

const openCustomPopupForm = () => {
  cy.get('button').contains('Custom population').click()
}

const fillName = () => {
  const name = `TEST-${new Date().getTime()}`
  cy.contains('Insert name for this custom population if you wish to save it')
    .siblings()
    .get('input[placeholder=name]')
    .type(name)
  return name
}

const save = () => {
  cy.get('button').contains('Save').click()
}

const selectSavedPopulation = name => {
  cy.get('[data-cy="history-search"]').children().eq(0).type(name).type('{enter}')
}

const deleteAllSearches = () => {
  cy.get('[data-cy="history-search"]').children().eq(0).click()
  cy.contains('Saved populations')
    .parent()
    .parent()
    .parent()
    .parent()
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

const fillForm = content => {
  cy.contains('Insert student numbers you wish to use for population here')
    .siblings()
    .get('textarea')
    .type(content.join('\n'))
}

const search = () => {
  cy.get('button').contains('Search population').click()
}

const searchFor = studentnumbers => {
  openCustomPopupForm()
  fillForm(studentnumbers)
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

describe('Custom population tests', () => {
  const nonExistentStudentNumbers = ['123', 'X', '-', ' ']
  beforeEach(() => {
    cy.init('/custompopulation')
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
  })

  after(() => {
    cy.visit(`${Cypress.config().baseUrl}/custompopulation`)
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
    cy.get('button').contains('Custom population').click()
    deleteAllSearches()
  })

  describe('Custom population searching', () => {
    it('Finds a proper population', () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1 }) => {
        const students = studentNumbersForCSStudentsSet1
        searchFor(students)
        hasLanded()
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)
      })
    })

    it("Doesn't return non-existing students", () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1 }) => {
        const students = [...studentNumbersForCSStudentsSet1, ...nonExistentStudentNumbers]
        searchFor(students)
        hasLanded()
        containsAmountOfStudents(studentNumbersForCSStudentsSet1.length)
        containsSpecificStudents(studentNumbersForCSStudentsSet1)
      })
    })

    it("Doesn't find empty custom population", () => {
      searchFor(nonExistentStudentNumbers)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Custom population')
    })

    it("Doesn't return students user has no right to", () => {
      // TODO: check that this doesn't create false positives, since this test goes
      // through even if following students are not in anon sis-db.
      const studentsForEduBachStudents = ['014990067', '013069465', '014853890']
      searchFor(studentsForEduBachStudents)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Custom population')
    })
  })

  describe('Custom population search saving', () => {
    it('Saves a custom population search', () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1 }) => {
        const students = studentNumbersForCSStudentsSet1
        openCustomPopupForm()
        const name = fillName()
        fillForm(students)
        save()

        // Round 1
        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)

        // Round 2
        cy.visit(`${Cypress.config().baseUrl}/custompopulation`)
        cy.url().should('include', '/custompopulation')
        cy.contains('Custom population')
        cy.get('button').contains('Custom population').click()
        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students.length)
        containsSpecificStudents(students)
      })
    })

    it('Updates a custom population search', () => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1, studentNumbersForCSStudentsSet2 }) => {
        const students1 = studentNumbersForCSStudentsSet1
        const students2 = studentNumbersForCSStudentsSet2
        openCustomPopupForm()
        const name = fillName()
        fillForm(students1)
        save()

        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students1.length)
        containsSpecificStudents(students1)
        cy.contains('Custom population')
        cy.get('button').contains('Custom population').click()
        selectSavedPopulation(name)
        fillForm([...students1, ...students2])
        save()

        cy.visit(`${Cypress.config().baseUrl}/custompopulation`)
        cy.url().should('include', '/custompopulation')
        cy.contains('Custom population')
        cy.get('button').contains('Custom population').click()
        selectSavedPopulation(name)
        search()
        cy.contains(`Custom population "${name}"`)
        containsAmountOfStudents(students1.length + students2.length)
        containsSpecificStudents([...students1, ...students2])
      })
    })
  })
})
