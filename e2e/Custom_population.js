import { test, expect } from '@playwright/test'
/// <reference types="cypress" />
const fillName = async page => {
  const name = `TEST-${new Date().getTime()}`
  cy.contains('Insert a name for this custom population if you wish to save it')
  cy.cs('custom-population-name-input').type(name)
  return name
}
const save = async page => {
  cy.get('button').contains('Save').click()
}
const selectSavedPopulation = async (page, name) => {
  cy.cs('history-search').type(`${name}{enter}`)
}
const deleteAllSearches = async page => {
  cy.cs('history-search').click()
  cy.get('.MuiAutocomplete-popper > .MuiPaper-root')
    .find('li[role=option]')
    .then($lis => {
      const labels = [...$lis].map(li => li.textContent?.trim() || '')
      labels.forEach((label, index) => {
        if (index !== 0) cy.cs('history-search').click()
        page.locator('text=.MuiAutocomplete-popper li[role=option]', label).click()
        page.locator('text=button', 'text=Delete').click()
      })
    })
}
const fillForm = async (page, content, separator) => {
  cy.cs('student-number-input').type(content.join(separator))
}
const search = async page => {
  cy.cs('search-button').click()
}
const searchFor = (studentnumbers, separator) => {
  fillForm(page)
  search(page)
}
const hasLanded = async page => {
  cy.contains('Credit accumulation')
  cy.contains('Programme distribution')
  cy.contains('Courses of population')
  cy.contains('Students')
}
const containsAmountOfStudents = async (page, amount = 0) => {
  cy.contains(`Credit accumulation (for ${amount} students)`)
}
const containsSpecificStudents = async (page, studentnumbers = []) => {
  cy.contains(`Students (${studentnumbers.length})`)
    .parent()
    .then($parentDiv => {
      if (!$parentDiv.hasClass('active')) page.locator(`Students (${studentnumbers.length})`).click()
    })
  studentnumbers.forEach(s => cy.contains(s))
}
const checkRightsNotification = async (page, studentNumbers) => {
  cy.cs('rights-notification').within(() => {
    cy.contains(
      'The following students information could not be displayed. This could be either because they do not exist, or you do not have the right to view their information.'
    )
    cy.get('ul').within(() => {
      studentNumbers.forEach(number => cy.get('li').contains(number))
    })
  })
}
test.describe('Custom population tests', () => {
  const nonExistentStudentNumbers = ['123', 'X', '-']
  test.beforeEach(async ({ page }) => {
    cy.init('/custompopulation')
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
  })
  test.afterAll(() => {
    page.goto('/custompopulation')
    cy.url().should('include', '/custompopulation')
    cy.contains('Custom population')
    deleteAllSearches(page)
  })
  test.describe('Custom population searching', () => {
    test('Finds a proper population', async ({ page }) => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        searchFor(students, '\n')
        hasLanded(page)
        containsAmountOfStudents(page)
        containsSpecificStudents(page)
      })
    })
    test("Doesn't return non-existing students", async ({ page }) => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        searchFor([...students, ...nonExistentStudentNumbers], ' ')
        hasLanded(page)
        containsAmountOfStudents(page)
        containsSpecificStudents(page)
        checkRightsNotification(page)
      })
    })
    test("Doesn't find empty custom population", async ({ page }) => {
      searchFor(nonExistentStudentNumbers, ',')
      checkRightsNotification(page)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Back to search form')
    })
    test("Doesn't return students user has no right to", async ({ page }) => {
      // These students exist in the database, but the user doesn't have the right to view them
      const studentsForEduBachStudents = ['014990067', '013069465', '014853890']
      // Two semicolons on purpose, the page should be able to handle it
      searchFor(studentsForEduBachStudents, ';;')
      checkRightsNotification(page)
      cy.contains('Credit accumulation').should('not.exist')
      cy.contains('Programme distribution').should('not.exist')
      cy.contains('Courses of population').should('not.exist')
      cy.get('button').contains('Back to search form')
    })
  })
  test.describe('Custom population search saving', () => {
    test('Saves a custom population search', async ({ page }) => {
      cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1: students }) => {
        cy.contains(
          'Insert student numbers to use for the population. Each student number needs to be separated with a comma, a semicolon, a space, or a line break.'
        )
        const name = fillName()
        fillForm(page)
        save(page)
        selectSavedPopulation(page)
        search(page)
        cy.contains(`Custom population: ${name}`)
        containsAmountOfStudents(page)
        containsSpecificStudents(page)
        page.goto('/custompopulation')
        cy.contains('Custom population')
        selectSavedPopulation(page)
        search(page)
        cy.contains(`Custom population: ${name}`)
        containsAmountOfStudents(page)
        containsSpecificStudents(page)
      })
    })
    test('Updates a custom population search', async ({ page }) => {
      cy.fixture('customPopulations').then(
        ({ studentNumbersForCSStudentsSet1: students1, studentNumbersForCSStudentsSet2: students2 }) => {
          const name = fillName()
          fillForm(page)
          save(page)
          selectSavedPopulation(page)
          search(page)
          cy.contains(`Custom population: ${name}`)
          containsAmountOfStudents(page)
          containsSpecificStudents(page)
          page.locator('text=Back to search form').click()
          selectSavedPopulation(page)
          fillForm(page)
          save(page)
          page.goto('/custompopulation')
          cy.contains('Custom population')
          selectSavedPopulation(page)
          search(page)
          cy.contains(`Custom population: ${name}`)
          containsAmountOfStudents(page)
          containsSpecificStudents(page)
        }
      )
    })
  })
})
