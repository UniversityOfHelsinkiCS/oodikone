/// <reference types="Cypress" />

// const baseUrl = Cypress.config().baseUrl

const checkFilteringResult = studentCount => {
  cy.contains(`Students (${studentCount})`)
}

// Semantic UI doesn't allow injection of data-cy:s for single multiple dropdown selection.
// This function tries to click "x" on all selections inside dropdown matching given attribute
const clearSemanticUIMultipleDropDownSelection = dataCyAttribute => {
  cy.cs(dataCyAttribute).find('i.delete').click({ force: true })
  cy.cs(dataCyAttribute).click()
}

const clearSingleDropdownSelection = dataCyAttribute => {
  cy.cs(dataCyAttribute).find('i.clear').click({ force: true })
}

const testRangeFilter = (parentEl, min, max, expected) => {
  cy.cs(parentEl)
    .cs('range-selector-min')
    .find('input')
    .invoke('val')
    .then(initialMin => {
      cy.cs(parentEl)
        .cs('range-selector-max')
        .find('input')
        .invoke('val')
        .then(initialMax => {
          cy.cs(parentEl).cs('range-selector-min').find('input').type(`{selectall}{backspace}${min}`).blur()
          cy.cs(parentEl).cs('range-selector-max').find('input').type(`{selectall}{backspace}${max}`).blur()

          checkFilteringResult(expected)

          cy.cs(parentEl).cs('range-selector-min').find('input').type(`{selectall}{backspace}${initialMin}`).blur()
          cy.cs(parentEl).cs('range-selector-max').find('input').type(`{selectall}{backspace}${initialMax}`).blur()
        })
    })
}

// Helper tool to create pre and post steps for each filter step. Created to avoid copypasting clicking and checking
// to every it-function. Reason behind using test function wrapper is that Cypresses internal beforeEach / afterEach
// functions don't take any parameters and using global object for matching test step name seemed overcomplicated.
const createRunTestStepWithPreAndPostPartsFunction = amountWithoutFiltering => {
  return (filterName, testStepFunctionToRun) => {
    const card = cy.cs(`${filterName}-filter-card`)

    card.invoke('attr', 'data-open').then(open => {
      console.log('open', open)

      const getHeader = () => cy.cs(`${filterName}-header`)

      if (open === 'false') {
        getHeader().click({ force: true })
      }

      checkFilteringResult(amountWithoutFiltering)
      testStepFunctionToRun()
      checkFilteringResult(amountWithoutFiltering)

      if (open === 'false') {
        getHeader().click({ force: true })
      }
    })
  }
}

describe('Population Statistics', () => {
  const pathToCSBach2018 =
    '/populations?months=36&semesters=FALL&semesters=SPRING&studyRights={%22programme%22%3A%22KH50_005%22}&tag&year=2018'
  const defaultAmountOfStudents = 159
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  before(() => {
    cy.init(pathToCSBach2018)
  })

  it('Transfer filter is on not transferred by default', () => {
    cy.contains('By default only students who have not transferred to this study programme are shown.')

    runTestStepWithPreAndPostParts('TransferredToProgramme', () => {
      const card = cy.cs('TransferredToProgramme-filter-card')
      card.get('[data-cy="option-havenot"] input').should('be.checked')
    })
  })

  it('Programme defaults to "Active Study Right" mode', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      cy.cs('Programme-filter-mode-selector').children().eq(0).should('contain', 'Active Study Right')
    })
  })

  it('Programme filter works', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      const card = cy.cs('Programme-filter-card')
      const programmeDropdown = card.cs('Programme-filter-dropdown').selectFromDropdown(0)
      checkFilteringResult(5)
      programmeDropdown.get('i.delete').click()
    })
  })

  // The test does not work since it tries to filter by "Ravitsemustiede"-studytrack when checking
  // CS Bachelor students. Now that the irrelevant studytracks have been removed, the test fails.
  // So fix this
  it.skip('Study track filter works', () => {
    runTestStepWithPreAndPostParts('StudyTrack', () => {
      const card = cy.cs('StudyTrack-filter-card')
      const programmeDropdown = card.cs('StudyTrack-filter-dropdown').selectFromDropdown(0)
      checkFilteringResult(1)
      programmeDropdown.get('i.delete').click()
    })
  })

  it('Graduation filter works', () => {
    runTestStepWithPreAndPostParts('GraduatedFromProgramme', () => {
      const getCard = () => cy.cs('GraduatedFromProgramme-filter-card')

      const graduated = 11
      getCard().cs('option-graduated-true').click()
      checkFilteringResult(graduated)
      getCard().cs('option-graduated-false').click()
      checkFilteringResult(defaultAmountOfStudents - graduated)
      getCard().cs('option-all').click()
    })
  })

  it('Transfer filter works', () => {
    runTestStepWithPreAndPostParts('TransferredToProgramme', () => {
      const transferred = 1
      cy.cs('TransferredToProgramme-filter-card').cs('option-have').click()
      checkFilteringResult(transferred)
      cy.cs('TransferredToProgramme-filter-card').cs('option-all').click()
      checkFilteringResult(defaultAmountOfStudents + transferred)
      cy.cs('TransferredToProgramme-filter-card').cs('option-havenot').click()
    })
  })

  it('Enrollment filter works', () => {
    runTestStepWithPreAndPostParts('EnrollmentStatus', () => {
      cy.cs('enrollmentStatusFilter-status').selectFromDropdown(0)
      cy.cs('enrollmentStatusFilter-semesters').selectFromDropdown(0)
      checkFilteringResult(148)
      clearSemanticUIMultipleDropDownSelection('enrollmentStatusFilter-semesters')
    })
  })

  it('Credit filter works', () => {
    runTestStepWithPreAndPostParts('CreditsEarned', () => {
      testRangeFilter('CreditsEarned-filter-card', 50, 150, 118)
    })
  })

  it('Age filter works', () => {
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 20, 40, 47)
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(42)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(117)
      cy.cs('genderFilter-dropdown').selectFromDropdown(2)
      checkFilteringResult(0)
      cy.cs('genderFilter-dropdown').selectFromDropdown(3)
      checkFilteringResult(0)
      clearSingleDropdownSelection('genderFilter-dropdown')
    })
  })

  it('Starting year filter works', () => {
    runTestStepWithPreAndPostParts('StartYearAtUni', () => {
      cy.cs('startYearAtUni-dropdown').selectFromDropdown(0)
      checkFilteringResult(1)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
      cy.cs('startYearAtUni-dropdown').selectFromDropdown(7)
      checkFilteringResult(152)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
    })
  })

  // Return when we have +2020 population with admission types in data
  it.skip('Admission type filter works', () => {
    runTestStepWithPreAndPostParts('AdmissionTypeFilter', () => {
      cy.cs('admissionTypeFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(5)
      cy.cs('admissionTypeFilter-dropdown').selectFromDropdown(2)
      checkFilteringResult(10)
      clearSingleDropdownSelection('admissionTypeFilter-dropdown')
    })
  })

  // plz fix
  it.skip('Courses filter works', () => {
    // courses takes some time to load, wait for it to complete
    cy.wait(10000)
    runTestStepWithPreAndPostParts('Courses', () => {
      cy.cs('courseFilter-course-dropdown').click()
      const courses = ['TKT20001', 'MAT11002']
      cy.cs('courseFilter-course-dropdown').click().contains(courses[0]).click()
      checkFilteringResult(140)
      cy.cs(`courseFilter-${courses[0]}-dropdown`).selectFromDropdown(1)
      checkFilteringResult(131)
      cy.cs('courseFilter-course-dropdown').click().contains(courses[1]).click()
      checkFilteringResult(56)
      cy.cs(`courseFilter-${courses[1]}-dropdown`).selectFromDropdown(2)
      checkFilteringResult(2)
      courses.forEach(course => cy.cs(`courseFilter-${course}-clear`).click())
    })
  })

  it('Filter combinations work', () => {
    runTestStepWithPreAndPostParts('GraduatedFromProgramme', () => {
      runTestStepWithPreAndPostParts('Age', () => {
        const getCard = () => cy.cs('GraduatedFromProgramme-filter-card')
        getCard().cs('option-graduated-true').click()
        testRangeFilter('Age-filter-card', 20, 30, 1)
        getCard().cs('option-all').click()
      })
    })
  })
})

describe('Course Statistics', () => {
  const pathToDSAndAlgoSpring2019 =
    '/coursepopulation?coursecodes=%5B%22TKT20001%22%2C%2258131%22%5D&from=138&separate=true&to=138&years=Kev%C3%A4t%202019&unifyCourses=unifyStats'
  const defaultAmountOfStudents = 118
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  before(() => {
    cy.init(pathToDSAndAlgoSpring2019)
  })

  it('Grade filter works', () => {
    runTestStepWithPreAndPostParts('Grade', () => {
      cy.cs('gradeFilter-5').click()
      checkFilteringResult(20)
      cy.cs('gradeFilter-3').click()
      checkFilteringResult(38)
      cy.cs('gradeFilter-3').click()
      cy.cs('gradeFilter-5').click()
    })
  })

  it('Programme defaults to "Attainment" mode', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      cy.cs('Programme-filter-mode-selector').children().eq(0).should('contain', 'Attainment')
    })
  })

  it('Programme filter works', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      const card = cy.cs('Programme-filter-card')
      const programmeDropdown = card.cs('Programme-filter-dropdown').selectFromDropdown(1)
      checkFilteringResult(116)
      programmeDropdown.get('i.delete').click()
    })
  })

  // The test does not work since it tries to filter by "Ravitsemustiede"-studytrack when checking
  // CS Bachelor students. Now that the irrelevant studytracks have been removed, the test fails.
  // So fix this
  it.skip('Study track filter works', () => {
    runTestStepWithPreAndPostParts('StudyTrack', () => {
      const card = cy.cs('StudyTrack-filter-card')
      const programmeDropdown = card.cs('StudyTrack-filter-dropdown').selectFromDropdown(0)
      checkFilteringResult(1)
      programmeDropdown.get('i.delete').click()
    })
  })

  it('Age filter works', () => {
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 20, 40, 33)
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(27)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(91)
      cy.cs('genderFilter-dropdown').selectFromDropdown(2)
      checkFilteringResult(0)
      cy.cs('genderFilter-dropdown').selectFromDropdown(3)
      checkFilteringResult(0)
      clearSingleDropdownSelection('genderFilter-dropdown')
    })
  })

  it('Starting year filter works', () => {
    runTestStepWithPreAndPostParts('StartYearAtUni', () => {
      cy.cs('startYearAtUni-dropdown').selectFromDropdown([0])
      checkFilteringResult(1)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
      cy.cs('startYearAtUni-dropdown').selectFromDropdown(3)
      checkFilteringResult(84)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
    })
  })

  it('Filter combinations work', () => {
    runTestStepWithPreAndPostParts('Grade', () => {
      runTestStepWithPreAndPostParts('Age', () => {
        cy.cs('gradeFilter-3').click()
        testRangeFilter('Age-filter-card', 20, 30, 1)
        cy.cs('gradeFilter-3').click()
      })
    })
  })
})

describe('Custom Population Statistics', () => {
  let runTestStepWithPreAndPostParts

  before(() => {
    cy.init('/custompopulation')
    cy.cs('custom-pop-search-button').click()
    cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1, studentNumbersForCSStudentsSet2 }) => {
      const students = [...studentNumbersForCSStudentsSet1, ...studentNumbersForCSStudentsSet2]
      runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(students.length)
      cy.cs('student-no-input').click().type(students.join('\n'))
      cy.wait(10000)
    })
    cy.cs('search-button').click()
  })

  it('Age filter works', () => {
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 20, 30, 1)
    })
  })

  it('Programme defaults to "Active Study Right" mode', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      cy.cs('Programme-filter-mode-selector').children().eq(0).should('contain', 'Active Study Right')
    })
  })

  it('Programme filter works', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      const card = cy.cs('Programme-filter-card')
      const programmeDropdown = card.cs('Programme-filter-dropdown').selectFromDropdown(0)
      checkFilteringResult(5)
      programmeDropdown.get('i.delete').click()
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(3)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(2)
      cy.cs('genderFilter-dropdown').selectFromDropdown(2)
      checkFilteringResult(0)
      clearSingleDropdownSelection('genderFilter-dropdown')
      checkFilteringResult(5, true)
    })
  })

  it('Starting year filter works', () => {
    runTestStepWithPreAndPostParts('StartYearAtUni', () => {
      cy.cs('startYearAtUni-dropdown').selectFromDropdown([0])
      checkFilteringResult(1)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
      cy.cs('startYearAtUni-dropdown').click()
    })
  })

  it.skip('Courses filter works', () => {
    runTestStepWithPreAndPostParts('Courses', () => {
      const courses = ['MAT11001', 'TKT20004']
      cy.cs('courseFilter-course-dropdown')
        .click()
        .contains(courses[0] + ' ')
        .click()
      checkFilteringResult(5)
      cy.cs(`courseFilter-${courses[0]}-dropdown`).selectFromDropdown(1)
      checkFilteringResult(5)
      cy.cs('courseFilter-course-dropdown')
        .click()
        .contains(courses[1] + ' ')
        .click()
      checkFilteringResult(3)
      cy.cs(`courseFilter-${courses[1]}-dropdown`).selectFromDropdown(3)
      checkFilteringResult(1)
      courses.forEach(course => cy.cs(`courseFilter-${course}-clear`).click())
    })
  })
})
