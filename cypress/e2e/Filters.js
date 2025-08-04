/// <reference types="cypress" />

const setClockToMockedDate = () => {
  const MOCKED_DATE = new Date('2024-08-30')
  cy.clock(MOCKED_DATE, ['Date'])
}

const checkFilteredStudentCount = studentCount => {
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

const testRangeFilter = (filter, min, max, expected, reset) => {
  const minText = min.toString()
  const maxText = max.toString()
  const expectedText = expected.toString()

  const parent = `${filter}-filter-card`

  cy.cs(parent)
    .cs('FilterRangeStart')
    .find('input')
    .invoke('val')
    .then(initialMin => {
      cy.cs(parent)
        .cs('FilterRangeEnd')
        .find('input')
        .invoke('val')
        .then(initialMax => {
          cy.cs(parent).cs('FilterRangeStart').find('input').clear()
          cy.cs(parent).cs('FilterRangeStart').find('input').type(minText)
          cy.cs(parent).cs('FilterRangeEnd').find('input').clear()
          cy.cs(parent).cs('FilterRangeEnd').find('input').type(maxText)

          checkFilteredStudentCount(expectedText)

          if (reset) {
            cy.cs(parent).cs('FilterRangeStart').find('input').clear()
            cy.cs(parent).cs('FilterRangeStart').find('input').type(initialMin)
            cy.cs(parent).cs('FilterRangeEnd').find('input').clear()
            cy.cs(parent).cs('FilterRangeEnd').find('input')?.type(initialMax)
          }
        })
    })
}

// Helper tool to create pre and post steps for each filter step. Created to avoid copypasting clicking and checking
// to every it-function. Reason behind using test function wrapper is that Cypresses internal beforeEach / afterEach
// functions don't take any parameters and using global object for matching test step name seemed overcomplicated.
const createRunTestStepWithPreAndPostPartsFunction = amountWithoutFiltering => {
  return (filterName, testStepFunctionToRun) => {
    cy.cs(`${filterName}-filter-card`)
      .click()
      .then(_ => {
        checkFilteredStudentCount(amountWithoutFiltering)
        testStepFunctionToRun()
        checkFilteredStudentCount(amountWithoutFiltering)
      })
  }
}

describe("Population statistics with a master's programme", { testIsolation: false }, () => {
  const pathToMathMSc2020 = '/populations?years=2020&programme=MH50_001&semesters=FALL&semesters=SPRING'
  const defaultAmountOfStudents = 26
  const expectedBaMaStudents = 24
  const expectedMasterOnlyStudents = 2

  before(() => cy.init(pathToMathMSc2020))

  it('Study track filter works', () => {
    cy.cs('studyTrackFilter-header').click()
    cy.selectFromDropdown('studyTrackFilter', 0)
    checkFilteredStudentCount(15)

    cy.cs('studyTrackFilter-clear').click()
    cy.cs('studyTrackFilter-header').click()
  })

  it('Study right type filter works', () => {
    cy.cs('studyRightTypeFilter-header').click()
    cy.get('input[name="studyRightTypeFilter"][value="0"]').should('be.checked')

    // Bachelor + master
    cy.get('input[name="studyRightTypeFilter"][value="1"]').click()
    cy.get('input[name="studyRightTypeFilter"][value="1"]').should('be.checked')
    checkFilteredStudentCount(expectedBaMaStudents)
    // Master only
    cy.get('input[name="studyRightTypeFilter"][value="2"]').click()
    cy.get('input[name="studyRightTypeFilter"][value="2"]').should('be.checked')
    checkFilteredStudentCount(expectedMasterOnlyStudents)
    // All
    cy.get('input[name="studyRightTypeFilter"][value="0"]').click()
    cy.get('input[name="studyRightTypeFilter"][value="0"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents)

    cy.cs('studyRightTypeFilter-header').click()
  })
})

describe('Population Statistics', { testIsolation: false }, () => {
  const pathToMathBSc2020 = '/populations?years=2020&programme=KH50_001&semesters=FALL&semesters=SPRING'
  const defaultAmountOfStudents = 27
  const graduated = 16
  const transferred = 3

  before(() => cy.init(pathToMathBSc2020))
  beforeEach(() => setClockToMockedDate())

  it.skip('Study right type filter is not visible', () => {
    cy.contains('Study right type').should('not.exist')
  })

  // TODO: FilterRadio is not working correcly
  it.skip('Transfer filter works and is set to "not transferred" by default', () => {
    cy.cs('transferredToProgrammeFilter-filter-card').should('have.attr', 'data-active', 'true')
    cy.get('input[name="transferredToProgrammeFilter"][value="Not transferred"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents)

    cy.cs('transferredToProgrammeFilter-filter-card').should('have.attr', 'data-active', 'true')
    cy.get('input[name="transferredToProgrammeFilter"][value="Not transferred"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents)

    cy.get('input[name="transferredToProgrammeFilter"][value="Transferred"]').click()
    cy.get('input[name="transferredToProgrammeFilter"][value="Transferred"]').should('be.checked')
    checkFilteredStudentCount(transferred)

    cy.get('input[name="transferredToProgrammeFilter"][value="All"]').click()
    cy.get('input[name="transferredToProgrammeFilter"][value="All"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents + transferred)

    cy.get('input[name="transferredToProgrammeFilter"][value="Not transferred"]').click()
    cy.get('input[name="transferredToProgrammeFilter"][value="Not transferred"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Graduation filter works', () => {
    cy.cs('graduatedFromProgrammeFilter-header').click()

    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').should('be.checked')
    checkFilteredStudentCount(graduated)

    cy.get('input[name="graduatedFromProgrammeFilter"][value="-1"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="-1"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents - graduated)

    cy.get('input[name="graduatedFromProgrammeFilter"][value="0"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="0"]').should('be.checked')
    checkFilteredStudentCount(defaultAmountOfStudents)

    cy.cs('graduatedFromProgrammeFilter-header').click()
  })

  it('Enrollment filter works', () => {
    cy.cs('enrollmentStatusFilter-header').click()
    cy.selectFromDropdown('enrollmentStatusFilter-status', 0)
    cy.selectFromDropdown('enrollmentStatusFilter-semester', 'Syksy 2023')
    checkFilteredStudentCount(25)

    cy.cs('enrollmentStatusFilter-clear').click()
    cy.cs('enrollmentStatusFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Credit filter works', () => {
    cy.cs('creditsEarnedFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
    testRangeFilter('creditsEarnedFilter', 50, 150, 12)

    cy.cs('creditsEarnedFilter-clear').click()
    cy.cs('creditsEarnedFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Age filter works', () => {
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
    testRangeFilter('ageFilter', 23, 30, 21)

    cy.cs('ageFilter-clear').click()
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Gender filter works', () => {
    cy.cs('genderFilter-header').click()
    cy.selectFromDropdown('genderFilter', 0)
    checkFilteredStudentCount(13)
    cy.selectFromDropdown('genderFilter', 1)
    checkFilteredStudentCount(14)
    cy.selectFromDropdown('genderFilter', 2)
    checkFilteredStudentCount(0)
    cy.selectFromDropdown('genderFilter', 3)
    checkFilteredStudentCount(0)

    cy.cs('genderFilter-clear').click()
    cy.cs('genderFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Starting year filter works', () => {
    cy.cs('startYearAtUniFilter-header').click()
    cy.selectFromDropdown('startYearAtUniFilter', 0)
    checkFilteredStudentCount(1)
    cy.selectFromDropdown('startYearAtUniFilter', 7)
    checkFilteredStudentCount(21)

    cy.cs('startYearAtUniFilter-clear').click()
    cy.cs('startYearAtUniFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Admission type filter works', () => {
    cy.cs('admissionTypeFilter-header').click()
    cy.selectFromDropdown('admissionTypeFilter', 0)
    checkFilteredStudentCount(18)
    cy.selectFromDropdown('admissionTypeFilter', 1)
    checkFilteredStudentCount(6)

    cy.cs('admissionTypeFilter-clear').click()
    cy.cs('admissionTypeFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Courses filter works', () => {
    const courses = [
      { code: 'MAT21012', name: 'Differentiaaliyhtälöt I' },
      { code: 'MFK-M204', name: 'Matematiikkaa kaikkialla' },
    ]

    cy.cs('courseFilter-header').click()
    cy.selectFromDropdown('courseFilter', `${courses[0].code} - ${courses[0].name}`)
    checkFilteredStudentCount(9)
    cy.selectFromDropdown(`courseFilter-${courses[0].code}`, 1)
    checkFilteredStudentCount(7)
    cy.selectFromDropdown('courseFilter', `${courses[1].code} - ${courses[1].name}`)
    checkFilteredStudentCount(5)
    cy.selectFromDropdown(`courseFilter-${courses[1].code}`, 1)
    checkFilteredStudentCount(4)

    cy.cs(`courseFilter-${courses[1].code}-clear`).click()
    checkFilteredStudentCount(7)

    cy.cs('courseFilter-clear').click()
    cy.cs('courseFilter-header').click()

    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Filter combinations work', () => {
    checkFilteredStudentCount(defaultAmountOfStudents)

    cy.cs('graduatedFromProgrammeFilter-header').click()

    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').should('be.checked')
    checkFilteredStudentCount(graduated)

    cy.cs('ageFilter-header').click()
    testRangeFilter('ageFilter', 23, 30, 12)

    cy.cs('graduatedFromProgrammeFilter-clear').click()
    cy.cs('graduatedFromProgrammeFilter-header').click()
    cy.cs('ageFilter-clear').click()
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('"Reset All Filters" button works', () => {
    cy.cs('genderFilter-header').click()
    cy.selectFromDropdown('genderFilter', 0)
    checkFilteredStudentCount(13)
    cy.cs('startYearAtUniFilter-header').click()
    cy.selectFromDropdown('startYearAtUniFilter', 7)
    checkFilteredStudentCount(8)

    cy.cs('reset-all-filters').click()
    cy.cs('genderFilter-header').click()
    cy.cs('startYearAtUniFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })
})

describe('Population Statistics with Bachelor + Master', { testIsolation: false }, () => {
  const pathToMathBSc2017 =
    '/populations?years=2017&programme=KH50_001&showBachelorAndMaster=true&semesters=FALL&semesters=SPRING'
  const defaultAmountOfStudents = 47

  before(() => cy.init(pathToMathBSc2017))

  it('Graduation filter works', () => {
    cy.cs('graduatedFromProgrammeFilter-header').click()

    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="1"]').should('be.checked')
    checkFilteredStudentCount(42)
    cy.get('input[name="graduatedFromProgrammeFilter"][value="2"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="2"]').should('be.checked')
    checkFilteredStudentCount(18)
    cy.get('input[name="graduatedFromProgrammeFilter"][value="-1"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="-1"]').should('be.checked')
    checkFilteredStudentCount(5)
    cy.get('input[name="graduatedFromProgrammeFilter"][value="-2"]').click()
    cy.get('input[name="graduatedFromProgrammeFilter"][value="-2"]').should('be.checked')
    checkFilteredStudentCount(29)

    cy.cs('graduatedFromProgrammeFilter-clear').click()
    cy.cs('graduatedFromProgrammeFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Study right status filter works', () => {
    checkFilteredStudentCount(defaultAmountOfStudents)
    cy.cs('studyRightStatusFilter-header').click()

    // Bachelor
    cy.get('input[name="studyRightStatusFilter"][value="Active Bachelor study right"]').click()
    cy.get('input[name="studyRightStatusFilter"][value="Active Bachelor study right"]').should('be.checked')
    checkFilteredStudentCount(0)
    // Master (combined)
    cy.get('input[name="studyRightStatusFilter"][value="Active Master study right"]').click()
    cy.get('input[name="studyRightStatusFilter"][value="Active Master study right"]').should('be.checked')
    checkFilteredStudentCount(0)

    // Non-Bachelor
    cy.get('input[name="studyRightStatusFilter"][value="Inactive Bachelor study right"]').click()
    cy.get('input[name="studyRightStatusFilter"][value="Inactive Bachelor study right"]').should('be.checked')
    checkFilteredStudentCount(5)
    // Non-Master (combined)
    cy.get('input[name="studyRightStatusFilter"][value="Inactive Master study right"]').click()
    cy.get('input[name="studyRightStatusFilter"][value="Inactive Master study right"]').should('be.checked')
    checkFilteredStudentCount(24)

    cy.cs('studyRightStatusFilter-clear').click()
    cy.cs('studyRightStatusFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })
})

describe('Course Statistics', { testIsolation: false }, () => {
  const pathToLimits2021 =
    '/coursepopulation?coursecodes=%5B"MAT11003"%2C"57116"%2C"57016"%2C"AYMAT11003"%5D&from=72&separate=false&to=72&unifyCourses=unifyStats&years=2021-2022'
  const defaultAmountOfStudents = 48
  const runTestStepWithPreAndPostParts = createRunTestStepWithPreAndPostPartsFunction(defaultAmountOfStudents)

  before(() => cy.init(pathToLimits2021))
  beforeEach(() => setClockToMockedDate())

  it('Grade filter works', () => {
    checkFilteredStudentCount(defaultAmountOfStudents)
    cy.cs('gradeFilter-header').click()

    cy.cs('gradeFilter-5').click()
    checkFilteredStudentCount(23)
    cy.cs('gradeFilter-3').click()
    checkFilteredStudentCount(29)
    cy.cs('gradeFilter-3').click()
    cy.cs('gradeFilter-5').click()

    cy.cs('gradeFilter-clear').should('not.exist')

    cy.cs('gradeFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Programme filter works and defaults to "Attainment"', () => {
    checkFilteredStudentCount(defaultAmountOfStudents)
    cy.cs('programmeFilter-header').click()
    cy.cs('programmeFilter-mode-selector').children().eq(0).should('contain', 'Attainment')
    cy.selectFromDropdown('programmeFilter', 1)
    checkFilteredStudentCount(33)

    cy.cs('programmeFilter-clear').click()
    cy.cs('programmeFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Age filter works', () => {
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
    testRangeFilter('ageFilter', 21, 30, 36)

    cy.cs('ageFilter-clear').click()
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Gender filter works', () => {
    cy.cs('genderFilter-header').click()
    cy.selectFromDropdown('genderFilter', 0)
    checkFilteredStudentCount(9)
    cy.selectFromDropdown('genderFilter', 1)
    checkFilteredStudentCount(39)
    cy.selectFromDropdown('genderFilter', 2)
    checkFilteredStudentCount(0)
    cy.selectFromDropdown('genderFilter', 3)
    checkFilteredStudentCount(0)

    cy.cs('genderFilter-clear').click()
    cy.cs('genderFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Starting year filter works', () => {
    cy.cs('startYearAtUniFilter-header').click()
    cy.selectFromDropdown('startYearAtUniFilter', 0)
    checkFilteredStudentCount(1)
    cy.selectFromDropdown('startYearAtUniFilter', 10)
    checkFilteredStudentCount(24)

    cy.cs('startYearAtUniFilter-clear').click()
    cy.cs('startYearAtUniFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Filter combinations work', () => {
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
    testRangeFilter('ageFilter', 21, 30, 36)

    cy.cs('gradeFilter-header').click()
    cy.cs('gradeFilter-5').click()
    checkFilteredStudentCount(17)

    cy.cs('gradeFilter-clear').click()
    cy.cs('gradeFilter-header').click()
    cy.cs('ageFilter-clear').click()
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })
})

describe('Custom Population Statistics', { testIsolation: false }, () => {
  let defaultAmountOfStudents

  before(() => {
    cy.init('/custompopulation')
    cy.cs('custom-pop-search-button').click()
    cy.fixture('customPopulations').then(({ studentNumbersForCSStudentsSet1, studentNumbersForCSStudentsSet2 }) => {
      const students = [...studentNumbersForCSStudentsSet1, ...studentNumbersForCSStudentsSet2]
      defaultAmountOfStudents = students.length
      cy.cs('student-number-input').click()
      cy.cs('student-number-input').type(students.join('{enter}'))
      cy.cs('search-button').click()
    })
  })
  beforeEach(() => setClockToMockedDate())

  it('Age filter works', () => {
    cy.cs('ageFilter-header').click()
    testRangeFilter('ageFilter', 24, 28, 5)

    cy.cs('ageFilter-clear').click()
    cy.cs('ageFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Programme filter works and defaults to "Active Study Right"', () => {
    cy.cs('programmeFilter-header').click()
    cy.cs('programmeFilter-mode-selector').children().eq(0).should('contain', 'Active Study Right')
    cy.selectFromDropdown('programmeFilter', 1)
    checkFilteredStudentCount(3)

    cy.cs('programmeFilter-clear').click()
    cy.cs('programmeFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Gender filter works', () => {
    cy.cs('genderFilter-header').click()
    cy.selectFromDropdown('genderFilter', 0)
    checkFilteredStudentCount(5)
    cy.selectFromDropdown('genderFilter', 1)
    checkFilteredStudentCount(3)
    cy.selectFromDropdown('genderFilter', 2)
    checkFilteredStudentCount(0)
    cy.selectFromDropdown('genderFilter', 3)
    checkFilteredStudentCount(0)

    cy.cs('genderFilter-clear').click()
    cy.cs('genderFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Starting year filter works', () => {
    cy.cs('startYearAtUniFilter-header').click()
    cy.selectFromDropdown('startYearAtUniFilter', 0)
    checkFilteredStudentCount(2)

    cy.cs('startYearAtUniFilter-clear').click()
    cy.cs('startYearAtUniFilter-header').click()
    checkFilteredStudentCount(defaultAmountOfStudents)
  })

  it('Courses filter works', () => {
    const courses = [
      { code: 'MAT11005', name: 'Integraalilaskenta' },
      { code: 'MAT21007', name: 'Mitta ja integraali' },
    ]

    cy.cs('courseFilter-header').click()
    cy.selectFromDropdown('courseFilter', `${courses[0].code} - ${courses[0].name}`)
    checkFilteredStudentCount(7)
    cy.selectFromDropdown(`courseFilter-${courses[0].code}`, 1)
    checkFilteredStudentCount(6)
    cy.selectFromDropdown('courseFilter', `${courses[1].code} - ${courses[1].name}`)
    checkFilteredStudentCount(5)
    cy.selectFromDropdown(`courseFilter-${courses[1].code}`, 3)
    checkFilteredStudentCount(2)

    cy.cs(`courseFilter-${courses[1].code}-clear`).click()
    checkFilteredStudentCount(6)

    cy.cs('courseFilter-clear').click()
    cy.cs('courseFilter-header').click()

    checkFilteredStudentCount(defaultAmountOfStudents)
  })
})
