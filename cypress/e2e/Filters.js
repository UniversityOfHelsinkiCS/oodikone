/// <reference types="cypress" />

const MOCKED_DATE = new Date('2024-08-30').getTime()

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
  const minText = min.toString()
  const maxText = max.toString()
  const expectedText = expected.toString()

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
          cy.cs(parentEl).cs('range-selector-min').find('input').clear()
          cy.cs(parentEl).cs('range-selector-min').find('input').type(minText)
          cy.cs(parentEl).cs('range-selector-max').find('input').clear()
          cy.cs(parentEl).cs('range-selector-max').find('input').type(maxText)

          checkFilteringResult(expectedText)

          cy.cs(parentEl).cs('range-selector-min').find('input').clear()
          cy.cs(parentEl)
            .cs('range-selector-min')
            .find('input')
            .type(initialMin || '0')
          cy.cs(parentEl).cs('range-selector-max').find('input').clear()
          cy.cs(parentEl)
            .cs('range-selector-max')
            .find('input')
            ?.type(initialMax || '9000')
        })
    })
}

// Helper tool to create pre and post steps for each filter step. Created to avoid copypasting clicking and checking
// to every it-function. Reason behind using test function wrapper is that Cypresses internal beforeEach / afterEach
// functions don't take any parameters and using global object for matching test step name seemed overcomplicated.
const createRunTestStepWithPreAndPostPartsFunction = amountWithoutFiltering => {
  return (filterName, testStepFunctionToRun) => {
    cy.cs(`${filterName}-filter-card`)
      .invoke('attr', 'data-open')
      .then(open => {
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

describe("Population statistics with a master's programme", () => {
  const pathToMathMSc2020 =
    '/populations?months=49&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"MH50_001"%7D&year=2020'
  const defaultAmountOfStudents = 26
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)
  beforeEach(() => {
    cy.init(pathToMathMSc2020)
  })

  it('Study track filter works', () => {
    runTestStepWithPreAndPostParts('StudyTrack', () => {
      cy.cs('StudyTrack-filter-card').cs('StudyTrack-filter-dropdown').selectFromDropdown(0)
      checkFilteringResult(15)
      cy.cs('StudyTrack-filter-card').cs('StudyTrack-filter-dropdown').get('i.delete').click()
    })
  })

  describe('Study right type filter', () => {
    it('is visible', () => {
      cy.contains('Study right type')
    })

    it('is set to all by default', () => {
      runTestStepWithPreAndPostParts('studyRightTypeFilter', () => {
        cy.cs('studyRightTypeFilter-filter-card').get('[data-cy="all"] input').should('be.checked')
      })
    })

    it('works', () => {
      runTestStepWithPreAndPostParts('studyRightTypeFilter', () => {
        const expectedBaMaStudents = 24
        const expectedMasterOnlyStudents = 2
        cy.cs('studyRightTypeFilter-filter-card').cs('bama').click()
        checkFilteringResult(expectedBaMaStudents)
        cy.cs('studyRightTypeFilter-filter-card').cs('master').click()
        checkFilteringResult(expectedMasterOnlyStudents)
        cy.cs('studyRightTypeFilter-filter-card').cs('all').click()
        checkFilteringResult(defaultAmountOfStudents)
      })
    })
  })
})

describe('Population Statistics', () => {
  const pathToMathBSc2020 =
    '/populations?months=49&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"KH50_001"%7D&year=2020'
  const defaultAmountOfStudents = 27
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  beforeEach(() => {
    cy.init(pathToMathBSc2020)
  })

  it("Transfer filter is set to 'not transferred' by default", () => {
    cy.contains('By default only students who have not transferred to this study programme are shown.')

    runTestStepWithPreAndPostParts('TransferredToProgramme', () => {
      cy.cs('TransferredToProgramme-filter-card').get('[data-cy="option-havenot"] input').should('be.checked')
    })
  })

  it('Graduation filter works', { retries: 3 }, () => {
    runTestStepWithPreAndPostParts('GraduatedFromProgramme', () => {
      const getCard = () => cy.cs('GraduatedFromProgramme-filter-card')

      const graduated = 16
      getCard().cs('option-graduated-true').click()
      checkFilteringResult(graduated)
      getCard().cs('option-graduated-false').click()
      checkFilteringResult(defaultAmountOfStudents - graduated)
      getCard().cs('option-all').click()
    })
  })

  it('Transfer filter works', () => {
    runTestStepWithPreAndPostParts('TransferredToProgramme', () => {
      const transferred = 3
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
      cy.cs('enrollmentStatusFilter-semesters').selectFromDropdown(5)
      checkFilteringResult(25)
      clearSemanticUIMultipleDropDownSelection('enrollmentStatusFilter-semesters')
    })
  })

  it('Credit filter works', { retries: 3 }, () => {
    runTestStepWithPreAndPostParts('CreditsEarned', () => {
      testRangeFilter('CreditsEarned-filter-card', 50, 150, 12)
    })
  })

  it('Age filter works', { retries: 3 }, () => {
    cy.clock(MOCKED_DATE, ['Date'])
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 23, 30, 21)
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(13)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(14)
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
      checkFilteringResult(21)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
    })
  })

  it('Admission type filter works', () => {
    runTestStepWithPreAndPostParts('AdmissionType', () => {
      cy.cs('admissionTypeFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(18)
      cy.cs('admissionTypeFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(6)
      clearSingleDropdownSelection('admissionTypeFilter-dropdown')
    })
  })

  it('Courses filter works', () => {
    runTestStepWithPreAndPostParts('Courses', () => {
      const courses = [
        { code: 'MAT21012', name: 'Differentiaaliyhtälöt I' },
        { code: 'MFK-M204', name: 'Matematiikkaa kaikkialla' },
      ]
      cy.cs('courseFilter-course-dropdown').click()
      cy.contains(`${courses[0].code} - ${courses[0].name}`).click()
      checkFilteringResult(9)
      cy.cs(`courseFilter-${courses[0].code}-dropdown`).selectFromDropdown(1) // Passed students
      checkFilteringResult(7)
      cy.cs('courseFilter-course-dropdown').click()
      cy.contains(`${courses[1].code} - ${courses[1].name}`).click()
      checkFilteringResult(5)
      cy.cs(`courseFilter-${courses[1].code}-dropdown`).selectFromDropdown(1)
      checkFilteringResult(4)
      courses.forEach(({ code }) => {
        cy.cs(`courseFilter-${code}-clear`).click()
      })
    })
  })

  it('Filter combinations work', () => {
    cy.clock(MOCKED_DATE, ['Date'])
    runTestStepWithPreAndPostParts('GraduatedFromProgramme', () => {
      runTestStepWithPreAndPostParts('Age', () => {
        const getCard = () => cy.cs('GraduatedFromProgramme-filter-card')
        getCard().cs('option-graduated-true').click()
        testRangeFilter('Age-filter-card', 23, 30, 12)
        getCard().cs('option-all').click()
      })
    })
  })

  it('"Reset All Filters" button works', { retries: 3 }, () => {
    cy.cs('Gender-header').click()
    cy.cs('genderFilter-dropdown').selectFromDropdown(0)
    checkFilteringResult(13)
    cy.cs('StartYearAtUni-header').click()
    cy.cs('startYearAtUni-dropdown').selectFromDropdown(7)
    checkFilteringResult(8)
    cy.cs('reset-all-filters').click()
    checkFilteringResult(defaultAmountOfStudents)
  })

  it('Study right type filter is not visible', () => {
    cy.contains('Study right type').should('not.exist')
  })
})

describe('Population Statistics with Bachelor + Master', () => {
  const pathToMathBSc2017 =
    '/populations?months=91&semesters=FALL&semesters=SPRING&showBachelorAndMaster=true&studyRights=%7B%22programme%22%3A%22KH50_001%22%2C%22combinedProgramme%22%3A%22%22%7D&year=2017'
  const defaultAmountOfStudents = 47
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  beforeEach(() => {
    cy.init(pathToMathBSc2017)
  })

  it('Graduation filter works', () => {
    runTestStepWithPreAndPostParts('GraduatedFromProgramme', () => {
      const getCard = () => cy.cs('GraduatedFromProgramme-filter-card')

      getCard().cs('option-graduated-bachelor').click()
      checkFilteringResult(42)
      getCard().cs('option-graduated-master').click()
      checkFilteringResult(18)
      getCard().cs('option-not-graduated-bachelor').click()
      checkFilteringResult(5)
      getCard().cs('option-not-graduated-master').click()
      checkFilteringResult(29)
      getCard().cs('option-all').click()
    })
  })

  it('Study right status filter works', () => {
    runTestStepWithPreAndPostParts('studyRightStatusFilter', () => {
      const getCard = () => cy.cs('studyRightStatusFilter-filter-card')

      // First two are 0 because there are no semester enrollments for the current semester
      getCard().cs('option-active').click()
      checkFilteringResult(0)
      getCard().cs('option-active-combined').click()
      checkFilteringResult(0)
      getCard().cs('option-inactive').click()
      checkFilteringResult(5)
      getCard().cs('option-inactive-combined').click()
      checkFilteringResult(24)
      getCard().cs('option-activity-status-all').click()
    })
  })
})

describe('Course Statistics', () => {
  const pathToLimits2021 =
    '/coursepopulation?coursecodes=%5B"MAT11003"%2C"57116"%2C"57016"%2C"AYMAT11003"%5D&from=72&separate=false&to=72&unifyCourses=unifyStats&years=2021-2022'
  const defaultAmountOfStudents = 48
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  beforeEach(() => {
    cy.init(pathToLimits2021)
  })

  it('Grade filter works', () => {
    runTestStepWithPreAndPostParts('Grade', () => {
      cy.cs('gradeFilter-5').click()
      checkFilteringResult(23)
      cy.cs('gradeFilter-3').click()
      checkFilteringResult(29)
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
      cy.cs('Programme-filter-card').cs('Programme-filter-dropdown').selectFromDropdown(1)
      checkFilteringResult(33)
      cy.cs('Programme-filter-card').cs('Programme-filter-dropdown').get('i.delete').click()
    })
  })

  it('Age filter works', { retries: 3 }, () => {
    cy.clock(MOCKED_DATE, ['Date'])
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 21, 30, 36)
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(9)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(39)
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
      cy.cs('startYearAtUni-dropdown').selectFromDropdown(10)
      checkFilteringResult(24)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
    })
  })

  it('Filter combinations work', () => {
    cy.clock(MOCKED_DATE, ['Date'])
    runTestStepWithPreAndPostParts('Grade', () => {
      runTestStepWithPreAndPostParts('Age', () => {
        cy.cs('gradeFilter-5').click()
        checkFilteringResult(23)
        testRangeFilter('Age-filter-card', 21, 30, 17)
        cy.cs('gradeFilter-5').click()
      })
    })
  })
})

describe('Custom Population Statistics', () => {
  let runTestStepWithPreAndPostParts

  beforeEach(() => {
    cy.init('/custompopulation')
    cy.cs('custom-pop-search-button').click()
    cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1, studentNumbersForCSStudentsSet2 }) => {
      const students = [...studentNumbersForCSStudentsSet1, ...studentNumbersForCSStudentsSet2]
      runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(students.length)
      cy.cs('student-number-input').click()
      cy.cs('student-number-input').type(students.join('{enter}'))
      cy.cs('search-button').click()
    })
  })

  it('Age filter works', () => {
    cy.clock(MOCKED_DATE, ['Date'])
    runTestStepWithPreAndPostParts('Age', () => {
      testRangeFilter('Age-filter-card', 24, 28, 5)
    })
  })

  it('Programme defaults to "Active Study Right" mode', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      cy.cs('Programme-filter-mode-selector').children().eq(0).should('contain', 'Active Study Right')
    })
  })

  it('Programme filter works', () => {
    runTestStepWithPreAndPostParts('Programme', () => {
      cy.cs('Programme-filter-card').cs('Programme-filter-dropdown').selectFromDropdown(1)
      checkFilteringResult(3)
      cy.cs('Programme-filter-card').cs('Programme-filter-dropdown').get('i.delete').click()
    })
  })

  it('Gender filter works', () => {
    runTestStepWithPreAndPostParts('Gender', () => {
      cy.cs('genderFilter-dropdown').selectFromDropdown(0)
      checkFilteringResult(5)
      cy.cs('genderFilter-dropdown').selectFromDropdown(1)
      checkFilteringResult(3)
      cy.cs('genderFilter-dropdown').selectFromDropdown(2)
      checkFilteringResult(0)
      clearSingleDropdownSelection('genderFilter-dropdown')
    })
  })

  it('Starting year filter works', () => {
    runTestStepWithPreAndPostParts('StartYearAtUni', () => {
      cy.cs('startYearAtUni-dropdown').selectFromDropdown(0)
      checkFilteringResult(2)
      clearSemanticUIMultipleDropDownSelection('startYearAtUni-dropdown')
    })
  })

  it('Courses filter works', () => {
    runTestStepWithPreAndPostParts('Courses', () => {
      const courses = [
        { code: 'MAT11005', name: 'Integraalilaskenta' },
        { code: 'MAT21007', name: 'Mitta ja integraali' },
      ]
      cy.cs('courseFilter-course-dropdown').click()
      cy.contains(`${courses[0].code} - ${courses[0].name}`).click()
      checkFilteringResult(7)
      cy.cs(`courseFilter-${courses[0].code}-dropdown`).selectFromDropdown(1)
      checkFilteringResult(6)
      cy.cs('courseFilter-course-dropdown').click()
      cy.contains(`${courses[1].code} - ${courses[1].name}`).click()
      checkFilteringResult(5)
      cy.cs(`courseFilter-${courses[1].code}-dropdown`).selectFromDropdown(3)
      checkFilteringResult(2)
      courses.forEach(({ code }) => {
        cy.cs(`courseFilter-${code}-clear`).click()
      })
    })
  })
})
