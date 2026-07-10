/// <reference types="cypress" />

// TODO: Test the pass rate and grade distribution charts and the Show relative toggle
// TODO: Test Export to Excel (assert that the file was downloaded, see other tests for examples)
// TODO: Test population link status (should be disabled for empty rows)
// TODO: Test Enrolled, no grade being null for years before Sisu era (currently displays 0 for empty)

const checkGradeTable = gradesTableContents => {
  cy.cs('Grade distribution')
    .parent()
    .then($el => {
      if (!$el.hasClass('Mui-expanded')) {
        cy.cs('Grade distribution').click()
      }

      cy.cs('Grade distribution-data')
        .get('table > tbody')
        .first()
        .within(() => {
          gradesTableContents.forEach((values, trIndex) => {
            cy.get('tr')
              .eq(trIndex)
              .within(() => {
                values.forEach((value, tdIndex) => {
                  if (value === null) return
                  cy.get('td').eq(tdIndex).contains(value)
                })
              })
          })
          cy.get('tr').should('have.length', gradesTableContents.length)
        })
    })
}

const checkTableContents = contents => {
  cy.get('table tbody').scrollIntoView()
  cy.get('table tbody').within(() => {
    contents.forEach((values, trIndex) => {
      cy.get('tr')
        .eq(trIndex)
        .within(() => {
          values.forEach((value, tdIndex) => {
            if (value === null) return
            cy.get('td').eq(tdIndex).contains(value)
          })
        })
    })
    cy.get('tr').should('have.length', contents.length)
  })
}

const toggleShowGrades = () => {
  cy.cs('gradeToggle', { force: true }).click({ force: true })
}

const toggleSeparateBySemesters = () => {
  cy.cs('separateToggle', { force: true }).click({ force: true })
}

const openStudentsTab = () => {
  cy.cs('StudentsTab').click()
}

const openAttemptsTab = () => {
  cy.cs('AttemptsTab').click()
}

const searchByCourseName = courseName => {
  cy.get("input[placeholder='Search by course name']").type(courseName)
}

const searchByCourseCode = courseCode => {
  cy.get("input[placeholder='Search by course code']").type(courseCode)
}

const clickNewQueryButton = () => {
  cy.cs('NewQueryButton').click()
}

const selectFromYear = year => {
  cy.cs('FromYearSelector').click()
  cy.cs(`FromYearSelectorOption${year}`).click()
}

const openSummaryTab = () => {
  cy.cs('SummaryTab').click()
}

const clickAway = () => {
  cy.get('body').click(0, 0)
}

const getCourseSearchHooksForSingleYear = code => {
  cy.intercept({
    pathname: '/api/coursesmulti',
    query: { code },
  }).as('courses')

  cy.intercept({
    pathname: '/api/courseyearlystats',
    query: { 'codes[]': code },
  }).as('yearlystats')

  cy.intercept({
    pathname: '/api/populationstatisticsbycourse',
  }).as('coursestats')
}

describe('Basic user', () => {
  beforeEach(() => {
    cy.init('/coursestatistics', 'basic')
    cy.url().should('include', '/coursestatistics')
  })

  it('Search should work on consecutive searches', () => {
    const coursecode1 = 'TKT20003'
    getCourseSearchHooksForSingleYear(coursecode1)

    searchByCourseCode(coursecode1)
    cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.cs(`course-${coursecode1}`).click()

    cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.url().should('contain', `courseCodes=%5B%22${coursecode1}%22%5D`)

    cy.contains('Show population').should('be.enabled')
    cy.contains('Show population').click()

    cy.wait('@coursestats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.contains(coursecode1)

    cy.contains('Courses').click()

    const coursecode2 = 'TKT20001'
    getCourseSearchHooksForSingleYear(coursecode2)

    searchByCourseCode(coursecode2)
    cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.cs(`course-${coursecode2}`).click()

    cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.url().should('contain', `courseCodes=%5B%22${coursecode2}%22%5D`)

    cy.contains('Show population').should('be.enabled')
    cy.contains('Show population').click()

    cy.wait('@coursestats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.contains(coursecode2)
  })

  describe('Course table can show non-standard grades', () => {
    it('Course table can show HT-TT grade scales', () => {
      const coursecode = 'KK-RUKIRJ'
      getCourseSearchHooksForSingleYear(coursecode)

      searchByCourseCode(coursecode)
      cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.cs(`course-${coursecode}`).click()

      cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.url().should('contain', `courseCodes=%5B%22${coursecode}%22%5D`)

      selectFromYear('2019-2020')
      cy.contains('Show population').should('be.enabled')
      cy.contains('Show population').click()

      cy.wait('@coursestats').its('response.statusCode').should('be.oneOf', [200, 304])

      const gradesTableContents = [
        [null, 'TT', 179],
        [null, 'No grade', 10],
        [null, 'HT', 179],
      ]
      checkGradeTable(gradesTableContents)
    })

    it("Course table can show old master's thesis grade scales", () => {
      const coursecode = '50131'
      getCourseSearchHooksForSingleYear(coursecode)

      searchByCourseCode(coursecode)
      cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.cs(`course-${coursecode}`).click()

      cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.url().should('contain', `courseCodes=%5B%22${coursecode}%22%5D`)

      cy.contains('50131') // Pro gradu -tutkielma tietojenkäsittelytieteessä
      cy.contains('Show population').should('be.enabled')
      cy.contains('Show population').click()

      cy.wait('@coursestats').its('response.statusCode').should('be.oneOf', [200, 304])

      cy.contains('Pro gradu -tutkielma tietojenkäsittelytieteessä')
      cy.contains('Class of 2007-2020, 10 students')
      cy.contains('Include substitutions, Open and normal')

      cy.contains('Showing 10 out of 10 students')

      const gradesTableContents = [
        [null, 'NSLA', 1],
        [null, 'L', 3],
        [null, 'ECLA', 5],
        [null, 'CL', 1],
      ]
      checkGradeTable(gradesTableContents)
    })

    it('Shows correct statistics for courses with scale passed-failed', () => {
      const coursecode = '200012'
      getCourseSearchHooksForSingleYear(coursecode)

      searchByCourseCode(coursecode)
      cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.cs(`course-${coursecode}`).click()

      cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.url().should('contain', `courseCodes=%5B%22${coursecode}%22%5D`)

      cy.contains('ON-310') // Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot
      cy.contains('200012') // Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot
      cy.contains('Show population').should('be.enabled')
      cy.contains('Show population').click()

      cy.wait('@coursestats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.contains('Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot')
      cy.contains('Class of 2011-2018, 4 students')
      cy.contains('Include substitutions, Open and normal')
      cy.contains('Showing 4 out of 4 students')

      const gradesTableContents = [
        [null, 'Hyv.', 3],
        [null, 'Hyl.', 1],
      ]
      checkGradeTable(gradesTableContents)
    })
  })

  describe('Course mappings work', () => {
    it('Searching single course having substitution mappings shows course statistics', () => {
      const coursecode = 'TKT20001'
      getCourseSearchHooksForSingleYear(coursecode)

      searchByCourseCode(coursecode)
      cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.cs(`course-${coursecode}`).click()

      cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.url().should('contain', `courseCodes=%5B%22${coursecode}%22%5D`)

      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('TKT20001')
      cy.contains('58131')

      openStudentsTab()
      cy.contains('svg', 'Pass rate')

      openAttemptsTab()
      cy.contains('svg', 'Pass rate')

      clickNewQueryButton()
      cy.contains('Search for courses')
    })

    it('Searching multiple courses having substitution mappings shows course statistics', () => {
      cy.intercept({
        pathname: '/api/coursesmulti',
        query: { code: 'TKT' },
      }).as('courses')

      cy.intercept({
        pathname: '/api/courseyearlystats',
        query: { 'codes[]': 'TKT20001', 'codes[]': 'TKT10002' },
      }).as('yearlystats')

      cy.intercept({
        pathname: '/api/populationstatisticsbycourse',
      }).as('coursestats')

      cy.cs('select-multiple-courses-toggle').should('not.have.class', 'Mui-checked')
      cy.cs('select-multiple-courses-toggle').click()
      cy.cs('select-multiple-courses-toggle').should('have.class', 'Mui-checked')

      searchByCourseCode('TKT')
      cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.cs(`course-TKT20001`).click()
      cy.cs(`course-TKT10002`).click()

      cy.contains('Fetch statistics').should('be.enabled')
      cy.contains('Fetch statistics').click()

      cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
      cy.url().should('contain', 'courseCodes=%5B%22TKT10002%22%2C%22TKT20001%22%5D')

      openSummaryTab()
      cy.contains('Tietorakenteet ja algoritmit').click()
      cy.contains('TKT10002').should('exist')
      cy.contains('TKT20001').should('exist')
      cy.contains('58131').should('not.exist')

      openSummaryTab()
      cy.contains('Ohjelmoinnin perusteet').click()
      cy.contains('TKT10002').should('exist')
      cy.contains('TKT20001').should('exist')
      cy.contains('Käyttöjärjestelmät').should('not.exist')
      cy.contains('581325').should('not.exist')
      openSummaryTab()
    })
  })

  it('On searches with multiple courses, has correct links on the Course tab', () => {
    cy.intercept({
      pathname: '/api/coursesmulti',
      query: { code: 'BSCS' },
    }).as('courses')

    cy.intercept({
      pathname: '/api/courseyearlystats',
      query: { 'codes[]': 'BSCS1003', 'codes[]': 'BSCS1001' },
    }).as('yearlystats')

    cy.intercept({
      pathname: '/api/populationstatisticsbycourse',
    }).as('coursestats')

    cy.cs('select-multiple-courses-toggle').should('not.have.class', 'Mui-checked')
    cy.cs('select-multiple-courses-toggle').click()
    cy.cs('select-multiple-courses-toggle').should('have.class', 'Mui-checked')

    searchByCourseCode('BSCS')
    cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.cs(`course-BSCS1003`).click()
    cy.cs(`course-BSCS1001`).click()

    cy.contains('Fetch statistics').should('be.enabled')
    cy.contains('Fetch statistics').click()

    cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.url().should('contain', 'courseCodes=%5B%22BSCS1001%22%2C%22BSCS1003%22%5D')

    cy.cs('course-population-for-2023-2024').click()
    cy.contains('Introduction to Programming')
    cy.contains('Class of 2023-2024')
    cy.contains('Include substitutions, Open and normal')

    // NOTE: These should also have `cy.intercept`s.
    //       The calls should be either cached or cheap so this is only
    //       necessary if the test is flaky.
    cy.go('back')
    cy.cs('CourseSelector').click()
    cy.cs('CourseSelectorOptionBSCS1003').click()
    // Check the link has updated correctly
    cy.cs('course-population-for-2022-2023').invoke('attr', 'href').should('include', 'BSCS1003')
    cy.cs('course-population-for-2022-2023').click()
    cy.contains('Data Structures and Algorithms')
    cy.contains('Class of 2022-2023')
    cy.contains('Include substitutions, Open and normal')
  })

  it('Searching course by name displays right courses', () => {
    cy.contains('Search for courses')
    searchByCourseName('tietokantojen perusteet')

    cy.contains('Tietokantojen perusteet')
    cy.cs(`course-TKT10004`).click()

    cy.contains('Search for courses').should('not.exist')

    cy.contains('TKT10004') // Tietokantojen perusteet
    cy.contains('AYTKT10004') // Avoin yo: Tietokantojen perusteet
    cy.contains('BSCS2001') // Introduction to Databases
    cy.contains('581328') // Tietokantojen perusteet
    cy.contains('A581328') //  Avoin yo: Tietokantojen perusteet
    clickNewQueryButton()
    cy.contains('Please enter at least 5 characters for course name or 2 characters for course code.')
  })

  it('Searching course by name displays right courses, 10 credit courses', { retries: 2 }, () => {
    cy.contains('Search for courses')
    searchByCourseName('tietorakenteet ja algoritmit')
    cy.contains('Tietorakenteet ja algoritmit')
    cy.cs(`course-TKT20001`).click()
    cy.contains('Search for courses').should('not.exist')

    cy.contains('TKT20001') // Tietorakenteet ja algoritmit
    cy.contains('AYTKT20001') // Avoin yo: Tietorakenteet ja algoritmit
    cy.contains('BSCS1003') // Data Structures and Algorithms
    cy.contains('58131') // Tietorakenteet
    clickNewQueryButton()
    cy.contains('Please enter at least 5 characters for course name or 2 characters for course code.')
    searchByCourseName('tietorakenteet ja algoritmit')
    cy.cs(`course-TKT20001`).click()

    cy.contains('Search for courses').should('not.exist')
    cy.contains('TKT20001') // Tietorakenteet ja algoritmit
    cy.contains('AYTKT20001') // Avoin yo: Tietorakenteet ja algoritmit
    cy.contains('BSCS1003') // Data Structures and Algorithms
    cy.contains('58131') // Tietorakenteet
  })

  it('"Select all search results" button is not showing unless "Select multiple courses" toggle is on', () => {
    cy.contains('Search for courses')
    searchByCourseCode('TKT')
    cy.cs('select-multiple-courses-toggle').should('not.have.class', 'Mui-checked')
    cy.contains('Select all search results').should('not.exist')
    cy.cs('select-multiple-courses-toggle').click()
    cy.cs('select-multiple-courses-toggle').should('have.class', 'Mui-checked')
    cy.contains('Select all search results')
  })

  it('Provider organization select works', () => {
    cy.contains('Search for courses')
    searchByCourseName('tietokantojen perusteet')

    cy.cs(`course-TKT10004`).click()
    cy.contains('Search for courses').should('not.exist')

    cy.contains('TKT10004') // Tietokantojen perusteet
    cy.contains('AYTKT10004') // Avoin yo: Tietokantojen perusteet
    cy.contains('BSCS2001') // Introduction to Databases
    cy.contains('581328') // Tietokantojen perusteet
    cy.contains('A581328') // Avoin yo: Tietokantojen perusteet

    cy.cs('ProviderOrganizationSelect').click()
    cy.cs('ProviderOrganizationSelectOptionBoth').should('have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionRegular').should('not.have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionOpen').should('not.have.class', 'Mui-selected')

    cy.cs('ProviderOrganizationSelectOptionRegular').click()
    cy.cs('ProviderOrganizationSelectOptionBoth').should('not.have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionRegular').should('have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionOpen').should('not.have.class', 'Mui-selected')

    cy.cs('ProviderOrganizationSelect').click()
    cy.cs('ProviderOrganizationSelectOptionOpen').click()
    cy.cs('ProviderOrganizationSelectOptionBoth').should('not.have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionRegular').should('not.have.class', 'Mui-selected')
    cy.cs('ProviderOrganizationSelectOptionOpen').should('have.class', 'Mui-selected')
  })

  describe('Course populations', () => {
    it('Can find course population', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20003')
      cy.contains('tr', 'TKT20003').click()
      cy.contains('TKT20003') // Käyttöjärjestelmät
      cy.contains('582219') //  Käyttöjärjestelmät
      cy.cs('course-population-for-2020-2021').click()

      cy.contains('Käyttöjärjestelmät')
      cy.contains('Class of 2020-2021, 19 students')
      cy.contains('Include substitutions, Open and normal')

      cy.contains('TKT20003')

      cy.contains('Students (19)').click()
      cy.contains('394776')
      cy.contains('416369')
    })

    it('Population of course shows grades for each student', () => {
      searchByCourseCode('TKT20001')
      cy.cs(`course-TKT20001`).click()
      cy.contains('TKT20001') // Tietorakenteet ja algoritmit
      cy.contains('AYTKT20001') // Avoin yo: Tietorakenteet ja algoritmit
      cy.contains('BSCS1003') // Data Structures and Algorithms
      cy.contains('58131') // Tietorakenteet
      cy.cs('course-population-for-2019-2020').click()

      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('Class of 2019-2020, 32 students')
      cy.contains('Include substitutions, Open and normal')

      cy.contains('Students (32)').click()
      cy.contains('td', '394776').siblings().eq(2).contains('3')
      cy.contains('td', '497388').siblings().eq(2).contains('2')
    })

    it("In 'Course population' view, student numbers of students that the user isn't allowed to see are hidden", () => {
      searchByCourseCode('TKT20001')
      cy.cs(`course-TKT20001`).click()
      cy.contains('TKT20001') //  Tietorakenteet ja algoritmit
      cy.contains('AYTKT20001') // Avoin yo: Tietorakenteet ja algoritmit
      cy.contains('BSCS1003') // Data Structures and Algorithms
      cy.contains('58131') // Tietorakenteet
      cy.cs('course-population-for-2019-2020').click()

      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('Class of 2019-2020, 32 students')
      cy.contains('Include substitutions, Open and normal')

      cy.contains('Students (32)').click()
      cy.get('table tbody td').filter(':contains("Hidden")').should('have.length', 9)
    })
  })

  it('Language distribution is correct', () => {
    searchByCourseCode('TKT20003')
    cy.cs(`course-TKT20003`).click()
    cy.contains('TKT20003') // Käyttöjärjestelmät
    cy.contains('582219') // Käyttöjärjestelmät
    cy.cs('course-population-for-2021-2022').click()

    cy.contains('Käyttöjärjestelmät')
    cy.contains('Class of 2021-2022')
    cy.contains('Include substitutions, Open and normal')

    cy.contains('Language distribution').click()
    cy.contains('td', 'finnish').siblings().eq(0).contains('5')
    cy.contains('td', 'english').siblings().eq(0).contains('2')
  })

  describe('Single course stats', () => {
    describe('Combine substitutions off', () => {
      beforeEach(() => {
        cy.url().should('include', '/coursestatistics')
        cy.contains('Search for courses')
        cy.cs('combine-substitutions-toggle').should('have.class', 'Mui-checked').click()
        cy.cs('combine-substitutions-toggle').should('not.have.class', 'Mui-checked')
        searchByCourseCode('TKT10002')
        cy.cs(`course-TKT10002`).click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('TKT10002') // Ohjelmoinnin perusteet
      })

      it('Time range', () => {
        cy.cs('FromYearSelector').click()
        cy.cs('FromYearSelectorOption2016-2017').should('have.class', 'Mui-selected')
        cy.get('[data-cy^="FromYearSelectorOption"]').should('have.length', 8)
        clickAway()

        cy.cs('ToYearSelector').click()
        cy.cs('ToYearSelectorOption2023-2024').should('have.class', 'Mui-selected')
        cy.get('[data-cy^="ToYearSelectorOption"]').should('have.length', 8)
        clickAway()

        cy.contains('Show population').should('be.enabled')
      })

      // TODO: Writing these as backend api tests
      describe.skip('Students tab', () => {
        describe('Info boxes', () => {
          it('Student statistics table', () => {
            cy.cs('StudentStatistics-info-box-button').click()
            cy.cs('StudentStatistics-info-box-content').contains('Table - Students')
          })

          it('Pass rate', () => {
            cy.cs('PassRateStudents-info-box-button').click()
            cy.cs('PassRateStudents-info-box-content').contains('Pass rate - Students')
          })

          it('Grade distribution', () => {
            toggleShowGrades()
            cy.cs('GradeDistribution-info-box-button').click()
            cy.cs('GradeDistribution-info-box-content').contains('Grade distribution')
          })
        })

        it('Show grades off, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 183, 140, 6, 37, '76.50 %', '23.50 %'],
            ['2023-2024', 7, 1, 0, 6, '14.29 %', '85.71 %'],
            ['2022-2023', 32, 26, 0, 6, '81.25 %', '18.75 %'],
            ['2021-2022', 39, 14, 0, 25, '35.90 %', '64.10 %'],
            ['2020-2021', 21, 21, 0, null, '100.00 %', '0.00 %'],
            ['2019-2020', 28, 28, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 29, 27, 2, null, '93.10 %', '6.90 %'],
            ['2017-2018', 26, 22, 4, null, '84.62 %', '15.38 %'],
            ['2016-2017', 1, 1, 0, null, '100.00 %', '0.00 %'],
          ]
          checkTableContents(tableContents)
        })

        it('Show grades off, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 185, 140, 6, 39, '75.68 %', '24.32 %'],
            ['Syksy 2023', 7, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 10, 9, 0, 1, '90.00 %', '10.00 %'],
            ['Syksy 2022', 22, 17, 0, 5, '77.27 %', '22.73 %'],
            ['Kevät 2022', 26, 9, 0, 17, '34.62 %', '65.38 %'],
            ['Syksy 2021', 15, 5, 0, 10, '33.33 %', '66.67 %'],
            ['Kevät 2021', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 18, 18, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 25, 25, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 7, 7, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 22, 20, 2, null, '90.91 %', '9.09 %'],
            ['Kevät 2018', 18, 14, 4, null, '77.78 %', '22.22 %'],
            ['Syksy 2017', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 1, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 183, 6, 3, 8, 5, 24, 99, 1, 37, '76.50 %', '23.50 %'],
            ['2023-2024', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
            ['2022-2023', 32, 0, 0, 0, 0, 6, 20, 0, 6, '81.25 %', '18.75 %'],
            ['2021-2022', 39, 0, 0, 0, 0, 2, 12, 0, 25, '35.90 %', '64.10 %'],
            ['2020-2021', 21, 0, 0, 1, 0, 2, 17, 1, null, '100.00 %', '0.00 %'],
            ['2019-2020', 28, 0, 1, 4, 1, 5, 17, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 29, 2, 2, 1, 2, 3, 19, 0, null, '93.10 %', '6.90 %'],
            ['2017-2018', 26, 4, 0, 2, 2, 5, 13, 0, null, '84.62 %', '15.38 %'],
            ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleShowGrades()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 185, 6, 3, 8, 5, 24, 99, 1, 39, '75.68 %', '24.32 %'],
            ['Syksy 2023', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 10, 0, 0, 0, 0, 3, 6, 0, 1, '90.00 %', '10.00 %'],
            ['Syksy 2022', 22, 0, 0, 0, 0, 3, 14, 0, 5, '77.27 %', '22.73 %'],
            ['Kevät 2022', 26, 0, 0, 0, 0, 2, 7, 0, 17, '34.62 %', '65.38 %'],
            ['Syksy 2021', 15, 0, 0, 0, 0, 0, 5, 0, 10, '33.33 %', '66.67 %'],
            ['Kevät 2021', 3, 0, 0, 0, 0, 0, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 18, 0, 0, 1, 0, 2, 14, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 3, 0, 0, 0, 1, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 25, 0, 1, 4, 0, 5, 15, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 7, 0, 0, 0, 1, 1, 5, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 22, 2, 2, 1, 1, 2, 14, 0, null, '90.91 %', '9.09 %'],
            ['Kevät 2018', 18, 4, 0, 2, 0, 3, 9, 0, null, '77.78 %', '22.22 %'],
            ['Syksy 2017', 8, 0, 0, 0, 2, 2, 4, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleShowGrades()
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })
      })

      // TODO: Writing these as backend api tests
      describe.skip('Attempts tab', () => {
        beforeEach(() => {
          openAttemptsTab()
        })

        describe('Info boxes', () => {
          it('Attempt statistics table', () => {
            cy.cs('AttemptStatistics-info-box-button').click()
            cy.cs('AttemptStatistics-info-box-content').contains('Table - Attempts')
          })

          it('Pass rate', () => {
            cy.cs('PassRateAttempts-info-box-button').click()
            cy.cs('PassRateAttempts-info-box-content').contains('Pass rate - Attempts')
          })

          it('Grade distribution', () => {
            toggleShowGrades()
            cy.cs('GradeDistribution-info-box-button').click()
            cy.cs('GradeDistribution-info-box-content').contains('Grade distribution')
          })
        })

        it('Show grades off, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 178, 140, 6, '95.89 %', 73],
            ['2023-2024', 6, 1, null, '16.67 %', 6],
            ['2022-2023', 26, 26, null, '100.00 %', 26],
            ['2021-2022', 41, 14, null, '34.15 %', 41],
            ['2020-2021', 21, 21, null, '100.00 %', null],
            ['2019-2020', 28, 28, null, '100.00 %', null],
            ['2018-2019', 29, 27, 2, '93.10 %', null],
            ['2017-2018', 26, 22, 4, '84.62 %', null],
            ['2016-2017', 1, 1, null, '100.00 %', null],
          ]
          checkTableContents(tableContents)
        })

        it('Show grades off, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 178, 140, 6, '95.89 %', 73],
            ['Syksy 2023', 6, 1, 0, '16.67 %', 6],
            ['Kevät 2023', 11, 9, 0, '81.82 %', 11],
            ['Syksy 2022', 15, 17, 0, '100.00 %', 15],
            ['Kevät 2022', 29, 9, 0, '31.03 %', 29],
            ['Syksy 2021', 12, 5, 0, '41.67 %', 12],
            ['Kevät 2021', 3, 3, 0, '100.00 %', null],
            ['Syksy 2020', 18, 18, 0, '100.00 %', null],
            ['Kevät 2020', 3, 3, 0, '100.00 %', null],
            ['Syksy 2019', 25, 25, 0, '100.00 %', null],
            ['Kevät 2019', 7, 7, 0, '100.00 %', null],
            ['Syksy 2018', 22, 20, 2, '90.91 %', null],
            ['Kevät 2018', 18, 14, 4, '77.78 %', null],
            ['Syksy 2017', 8, 8, 0, '100.00 %', null],
            ['Kevät 2017', 0, 0, 0, '–', 0],
            ['Syksy 2016', 1, 1, 0, '100.00 %', null],
          ]
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 178, 6, 3, 8, 5, 24, 99, 1],
            ['2023-2024', 6, 0, 0, 0, 0, 0, 1, 0],
            ['2022-2023', 26, 0, 0, 0, 0, 6, 20, 0],
            ['2021-2022', 41, 0, 0, 0, 0, 2, 12, 0],
            ['2020-2021', 21, 0, 0, 1, 0, 2, 17, 1],
            ['2019-2020', 28, 0, 1, 4, 1, 5, 17, 0],
            ['2018-2019', 29, 2, 2, 1, 2, 3, 19, 0],
            ['2017-2018', 26, 4, 0, 2, 2, 5, 13, 0],
            ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0],
          ]
          toggleShowGrades()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 178, 6, 3, 8, 5, 24, 99, 1],
            ['Syksy 2023', 6, 0, 0, 0, 0, 0, 1, 0],
            ['Kevät 2023', 11, 0, 0, 0, 0, 3, 6, 0],
            ['Syksy 2022', 15, 0, 0, 0, 0, 3, 14, 0],
            ['Kevät 2022', 29, 0, 0, 0, 0, 2, 7, 0],
            ['Syksy 2021', 12, 0, 0, 0, 0, 0, 5, 0],
            ['Kevät 2021', 3, 0, 0, 0, 0, 0, 3, 0],
            ['Syksy 2020', 18, 0, 0, 1, 0, 2, 14, 1],
            ['Kevät 2020', 3, 0, 0, 0, 1, 0, 2, 0],
            ['Syksy 2019', 25, 0, 1, 4, 0, 5, 15, 0],
            ['Kevät 2019', 7, 0, 0, 0, 1, 1, 5, 0],
            ['Syksy 2018', 22, 2, 2, 1, 1, 2, 14, 0],
            ['Kevät 2018', 18, 4, 0, 2, 0, 3, 9, 0],
            ['Syksy 2017', 8, 0, 0, 0, 2, 2, 4, 0],
            ['Kevät 2017', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2016', 1, 0, 0, 0, 0, 1, 0, 0],
          ]
          toggleShowGrades()
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })
      })
    })

    describe('Combine substitutions on', () => {
      beforeEach(() => {
        cy.url().should('include', '/coursestatistics')
        cy.contains('Search for courses')
        searchByCourseCode('TKT10002')
        cy.cs(`course-TKT10002`).click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('TKT10002') // Ohjelmoinnin perusteet
        cy.contains('AYTKT10002') // Avoin yo: Ohjelmoinnin perusteet
        cy.contains('BSCS1001') // Introduction to Programming
        cy.contains('581325') // Ohjelmoinnin perusteet
        cy.contains('A581325') //  Avoin yo: Ohjelmoinnin perusteet
      })

      it('Time range', () => {
        cy.cs('FromYearSelector').click()
        cy.cs('FromYearSelectorOption1999-2000').should('have.class', 'Mui-selected')
        cy.get('[data-cy^="FromYearSelectorOption"]').should('have.length', 25)
        clickAway()

        cy.cs('ToYearSelector').click()
        cy.cs('ToYearSelectorOption2023-2024').should('have.class', 'Mui-selected')
        cy.get('[data-cy^="ToYearSelectorOption"]').should('have.length', 25)
        clickAway()

        cy.contains('Show population').should('be.enabled')
      })

      // TODO: Writing these as backend api tests
      describe.skip('Students tab', () => {
        it('Show grades off, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 277, 237, 8, 32, '85.56 %', '14.44 %'],
            ['2023-2024', 8, 2, 0, 6, '25.00 %', '75.00 %'],
            ['2022-2023', 34, 27, 0, 7, '79.41 %', '20.59 %'],
            ['2021-2022', 45, 26, 0, 19, '57.78 %', '42.22 %'],
            ['2020-2021', 31, 31, 0, null, '100.00 %', '0.00 %'],
            ['2019-2020', 56, 56, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 41, 39, 2, null, '95.12 %', '4.88 %'],
            ['2017-2018', 32, 28, 4, null, '87.50 %', '12.50 %'],
            ['2016-2017', 6, 5, 1, null, '83.33 %', '16.67 %'],
            ['2015-2016', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['2014-2015', 5, 5, 0, null, '100.00 %', '0.00 %'],
            ['2013-2014', 2, 2, 0, null, '100.00 %', '0.00 %'],
            ['2012-2013', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['2011-2012', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2010-2011', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2009-2010', 0, 0, 0, null, '–', '–'],
            ['2008-2009', 1, 0, 1, null, '0.00 %', '100.00 %'],
            ['2007-2008', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2006-2007', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2005-2006', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2004-2005', 0, 0, 0, null, '–', '–'],
            ['2003-2004', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['2002-2003', 0, 0, 0, null, '–', '–'],
            ['2001-2002', 0, 0, 0, null, '–', '–'],
            ['2000-2001', 0, 0, 0, null, '–', '–'],
            ['1999-2000', 2, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          checkTableContents(tableContents)
        })

        it('Show grades off, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 282, 237, 9, 36, '84.04 %', '15.96 %'],
            ['Syksy 2023', 8, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 12, 10, 0, 2, '83.33 %', '16.67 %'],
            ['Syksy 2022', 22, 17, 0, 5, '77.27 %', '22.73 %'],
            ['Kevät 2022', 28, 11, 0, 17, '39.29 %', '60.71 %'],
            ['Syksy 2021', 21, 15, 0, 6, '71.43 %', '28.57 %'],
            ['Kevät 2021', 7, 7, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 24, 24, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 24, 24, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 32, 32, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 15, 14, 1, null, '93.33 %', '6.67 %'],
            ['Syksy 2018', 27, 25, 2, null, '92.59 %', '7.41 %'],
            ['Kevät 2018', 23, 19, 4, null, '82.61 %', '17.39 %'],
            ['Syksy 2017', 9, 9, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 3, 1, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 2, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 2, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2013', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2012', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2012', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2011', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2011', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2010', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2010', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2009', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2009', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2008', 1, 0, 1, null, '0.00 %', '100.00 %'],
            ['Kevät 2008', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2007', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2007', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2006', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2006', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2005', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2005', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2004', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2004', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2003', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2003', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2002', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2002', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2001', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2001', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2000', 0, 0, 0, 0, '–', '–'],
            ['Kevät 2000', 0, 0, 0, 0, '–', '–'],
            ['Syksy 1999', 2, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 277, 8, 4, 14, 9, 37, 168, 5, 32, '85.56 %', '14.44 %'],
            ['2023-2024', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
            ['2022-2023', 34, 0, 0, 0, 0, 6, 21, 0, 7, '79.41 %', '20.59 %'],
            ['2021-2022', 45, 0, 0, 1, 0, 2, 23, 0, 19, '57.78 %', '42.22 %'],
            ['2020-2021', 31, 0, 0, 1, 1, 2, 26, 1, null, '100.00 %', '0.00 %'],
            ['2019-2020', 56, 0, 1, 5, 3, 9, 38, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 41, 2, 3, 2, 2, 6, 26, 0, null, '95.12 %', '4.88 %'],
            ['2017-2018', 32, 4, 0, 3, 2, 6, 17, 0, null, '87.50 %', '12.50 %'],
            ['2016-2017', 6, 1, 0, 0, 1, 1, 3, 0, null, '83.33 %', '16.67 %'],
            ['2015-2016', 4, 0, 0, 1, 0, 0, 2, 1, null, '100.00 %', '0.00 %'],
            ['2014-2015', 5, 0, 0, 1, 0, 0, 1, 3, null, '100.00 %', '0.00 %'],
            ['2013-2014', 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['2012-2013', 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
            ['2011-2012', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['2010-2011', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['2009-2010', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['2008-2009', 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
            ['2007-2008', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['2006-2007', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['2005-2006', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['2004-2005', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['2003-2004', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['2002-2003', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['2001-2002', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['2000-2001', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['1999-2000', 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleShowGrades()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 282, 9, 4, 14, 9, 37, 168, 5, 36, '84.04 %', '15.96 %'],
            ['Syksy 2023', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 12, 0, 0, 0, 0, 3, 7, 0, 2, '83.33 %', '16.67 %'],
            ['Syksy 2022', 22, 0, 0, 0, 0, 3, 14, 0, 5, '77.27 %', '22.73 %'],
            ['Kevät 2022', 28, 0, 0, 0, 0, 2, 9, 0, 17, '39.29 %', '60.71 %'],
            ['Syksy 2021', 21, 0, 0, 1, 0, 0, 14, 0, 6, '71.43 %', '28.57 %'],
            ['Kevät 2021', 7, 0, 0, 0, 0, 0, 7, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 24, 0, 0, 1, 1, 2, 19, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 24, 0, 0, 1, 2, 4, 17, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 32, 0, 1, 4, 1, 5, 21, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 15, 1, 1, 1, 1, 2, 9, 0, null, '93.33 %', '6.67 %'],
            ['Syksy 2018', 27, 2, 2, 1, 1, 4, 17, 0, null, '92.59 %', '7.41 %'],
            ['Kevät 2018', 23, 4, 0, 3, 0, 4, 12, 0, null, '82.61 %', '17.39 %'],
            ['Syksy 2017', 9, 0, 0, 0, 2, 2, 5, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 2, 0, 0, 0, 0, 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 3, 0, 0, 1, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 0, 0, 0, 0, 0, 0, 3, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 2, 0, 0, 1, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2013', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2012', 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2012', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2011', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2011', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2010', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2010', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2009', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2009', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2008', 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
            ['Kevät 2008', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2007', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2007', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2006', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2006', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2005', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2005', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2004', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2004', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2003', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2003', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2002', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2002', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2001', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2001', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 2000', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Kevät 2000', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
            ['Syksy 1999', 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          toggleShowGrades()
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })
      })

      // TODO: Writing these as backend api tests
      describe.skip('Attempts tab', () => {
        beforeEach(() => {
          openAttemptsTab()
        })

        it('Show grades off, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 270, 237, 9, '96.34 %', 79],
            ['2023-2024', 6, 2, 0, '33.33 %', 6],
            ['2022-2023', 28, 27, 0, '96.43 %', 28],
            ['2021-2022', 45, 26, 0, '57.78 %', 45],
            ['2020-2021', 31, 31, 0, '100.00 %', null],
            ['2019-2020', 56, 56, 0, '100.00 %', null],
            ['2018-2019', 42, 39, 3, '92.86 %', null],
            ['2017-2018', 32, 28, 4, '87.50 %', null],
            ['2016-2017', 6, 5, 1, '83.33 %', null],
            ['2015-2016', 4, 4, 0, '100.00 %', null],
            ['2014-2015', 5, 5, 0, '100.00 %', null],
            ['2013-2014', 2, 2, 0, '100.00 %', null],
            ['2012-2013', 4, 4, 0, '100.00 %', null],
            ['2011-2012', 1, 1, 0, '100.00 %', null],
            ['2010-2011', 1, 1, 0, '100.00 %', null],
            ['2009-2010', 0, 0, 0, '–', null],
            ['2008-2009', 1, 0, 1, '0.00 %', null],
            ['2007-2008', 1, 1, 0, '100.00 %', null],
            ['2006-2007', 1, 1, 0, '100.00 %', null],
            ['2005-2006', 1, 1, 0, '100.00 %', null],
            ['2004-2005', 0, 0, 0, '–', null],
            ['2003-2004', 1, 1, 0, '100.00 %', null],
            ['2002-2003', 0, 0, 0, '–', null],
            ['2001-2002', 0, 0, 0, '–', null],
            ['2000-2001', 0, 0, 0, '–', null],
            ['1999-2000', 2, 2, 0, '100.00 %', null],
          ]
          checkTableContents(tableContents)
        })

        it('Show grades off, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 270, 237, 9, '96.34 %', 79],
            ['Syksy 2023', 6, 2, 0, '33.33 %', 6],
            ['Kevät 2023', 13, 10, 0, '76.92 %', 13],
            ['Syksy 2022', 15, 17, 0, '100.00 %', 15],
            ['Kevät 2022', 30, 11, 0, '36.67 %', 30],
            ['Syksy 2021', 15, 15, 0, '100.00 %', 15],
            ['Kevät 2021', 7, 7, 0, '100.00 %', null],
            ['Syksy 2020', 24, 24, 0, '100.00 %', null],
            ['Kevät 2020', 24, 24, 0, '100.00 %', null],
            ['Syksy 2019', 32, 32, 0, '100.00 %', null],
            ['Kevät 2019', 15, 14, 1, '93.33 %', null],
            ['Syksy 2018', 27, 25, 2, '92.59 %', null],
            ['Kevät 2018', 23, 19, 4, '82.61 %', null],
            ['Syksy 2017', 9, 9, 0, '100.00 %', null],
            ['Kevät 2017', 4, 3, 1, '75.00 %', null],
            ['Syksy 2016', 2, 2, 0, '100.00 %', null],
            ['Kevät 2016', 3, 3, 0, '100.00 %', null],
            ['Syksy 2015', 1, 1, 0, '100.00 %', null],
            ['Kevät 2015', 3, 3, 0, '100.00 %', null],
            ['Syksy 2014', 2, 2, 0, '100.00 %', null],
            ['Kevät 2014', 1, 1, 0, '100.00 %', null],
            ['Syksy 2013', 1, 1, 0, '100.00 %', null],
            ['Kevät 2013', 0, 0, 0, '–', null],
            ['Syksy 2012', 4, 4, 0, '100.00 %', null],
            ['Kevät 2012', 1, 1, 0, '100.00 %', null],
            ['Syksy 2011', 0, 0, 0, '–', null],
            ['Kevät 2011', 1, 1, 0, '100.00 %', null],
            ['Syksy 2010', 0, 0, 0, '–', null],
            ['Kevät 2010', 0, 0, 0, '–', null],
            ['Syksy 2009', 0, 0, 0, '–', null],
            ['Kevät 2009', 0, 0, 0, '–', null],
            ['Syksy 2008', 1, 0, 1, '0.00 %', null],
            ['Kevät 2008', 1, 1, 0, '100.00 %', null],
            ['Syksy 2007', 0, 0, 0, '–', null],
            ['Kevät 2007', 1, 1, 0, '100.00 %', null],
            ['Syksy 2006', 0, 0, 0, '–', null],
            ['Kevät 2006', 0, 0, 0, '–', null],
            ['Syksy 2005', 1, 1, 0, '100.00 %', null],
            ['Kevät 2005', 0, 0, 0, '–', null],
            ['Syksy 2004', 0, 0, 0, '–', null],
            ['Kevät 2004', 1, 1, 0, '100.00 %', null],
            ['Syksy 2003', 0, 0, 0, '–', null],
            ['Kevät 2003', 0, 0, 0, '–', null],
            ['Syksy 2002', 0, 0, 0, '–', null],
            ['Kevät 2002', 0, 0, 0, '–', null],
            ['Syksy 2001', 0, 0, 0, '–', null],
            ['Kevät 2001', 0, 0, 0, '–', null],
            ['Syksy 2000', 0, 0, 0, '–', null],
            ['Kevät 2000', 0, 0, 0, '–', null],
            ['Syksy 1999', 2, 2, 0, '100.00 %', null],
          ]
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters off', () => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 270, 9, 4, 14, 9, 37, 168, 5],
            ['2023-2024', 6, 0, 0, 0, 0, 0, 2, 0],
            ['2022-2023', 28, 0, 0, 0, 0, 6, 21, 0],
            ['2021-2022', 45, 0, 0, 1, 0, 2, 23, 0],
            ['2020-2021', 31, 0, 0, 1, 1, 2, 26, 1],
            ['2019-2020', 56, 0, 1, 5, 3, 9, 38, 0],
            ['2018-2019', 42, 3, 3, 2, 2, 6, 26, 0],
            ['2017-2018', 32, 4, 0, 3, 2, 6, 17, 0],
            ['2016-2017', 6, 1, 0, 0, 1, 1, 3, 0],
            ['2015-2016', 4, 0, 0, 1, 0, 0, 2, 1],
            ['2014-2015', 5, 0, 0, 1, 0, 0, 1, 3],
            ['2013-2014', 2, 0, 0, 0, 0, 0, 2, 0],
            ['2012-2013', 4, 0, 0, 0, 0, 3, 1, 0],
            ['2011-2012', 1, 0, 0, 0, 0, 0, 1, 0],
            ['2010-2011', 1, 0, 0, 0, 0, 1, 0, 0],
            ['2009-2010', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2008-2009', 1, 1, 0, 0, 0, 0, 0, 0],
            ['2007-2008', 1, 0, 0, 0, 0, 0, 1, 0],
            ['2006-2007', 1, 0, 0, 0, 0, 0, 1, 0],
            ['2005-2006', 1, 0, 0, 0, 0, 1, 0, 0],
            ['2004-2005', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2003-2004', 1, 0, 0, 0, 0, 0, 1, 0],
            ['2002-2003', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2001-2002', 0, 0, 0, 0, 0, 0, 0, 0],
            ['2000-2001', 0, 0, 0, 0, 0, 0, 0, 0],
            ['1999-2000', 2, 0, 0, 0, 0, 0, 2, 0],
          ]
          toggleShowGrades()
          checkTableContents(tableContents)
        })

        it('Show grades on, Separate by semesters on', () => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 270, 9, 4, 14, 9, 37, 168, 5],
            ['Syksy 2023', 6, 0, 0, 0, 0, 0, 2, 0],
            ['Kevät 2023', 13, 0, 0, 0, 0, 3, 7, 0],
            ['Syksy 2022', 15, 0, 0, 0, 0, 3, 14, 0],
            ['Kevät 2022', 30, 0, 0, 0, 0, 2, 9, 0],
            ['Syksy 2021', 15, 0, 0, 1, 0, 0, 14, 0],
            ['Kevät 2021', 7, 0, 0, 0, 0, 0, 7, 0],
            ['Syksy 2020', 24, 0, 0, 1, 1, 2, 19, 1],
            ['Kevät 2020', 24, 0, 0, 1, 2, 4, 17, 0],
            ['Syksy 2019', 32, 0, 1, 4, 1, 5, 21, 0],
            ['Kevät 2019', 15, 1, 1, 1, 1, 2, 9, 0],
            ['Syksy 2018', 27, 2, 2, 1, 1, 4, 17, 0],
            ['Kevät 2018', 23, 4, 0, 3, 0, 4, 12, 0],
            ['Syksy 2017', 9, 0, 0, 0, 2, 2, 5, 0],
            ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0],
            ['Syksy 2016', 2, 0, 0, 0, 0, 1, 1, 0],
            ['Kevät 2016', 3, 0, 0, 1, 0, 0, 2, 0],
            ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1],
            ['Kevät 2015', 3, 0, 0, 0, 0, 0, 0, 3],
            ['Syksy 2014', 2, 0, 0, 1, 0, 0, 1, 0],
            ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Syksy 2013', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Kevät 2013', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2012', 4, 0, 0, 0, 0, 3, 1, 0],
            ['Kevät 2012', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Syksy 2011', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2011', 1, 0, 0, 0, 0, 1, 0, 0],
            ['Syksy 2010', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2010', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2009', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2009', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2008', 1, 1, 0, 0, 0, 0, 0, 0],
            ['Kevät 2008', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Syksy 2007', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2007', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Syksy 2006', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2006', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2005', 1, 0, 0, 0, 0, 1, 0, 0],
            ['Kevät 2005', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2004', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2004', 1, 0, 0, 0, 0, 0, 1, 0],
            ['Syksy 2003', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2003', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2002', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2002', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2001', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2001', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 2000', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Kevät 2000', 0, 0, 0, 0, 0, 0, 0, 0],
            ['Syksy 1999', 2, 0, 0, 0, 0, 0, 2, 0],
          ]
          toggleShowGrades()
          toggleSeparateBySemesters()
          checkTableContents(tableContents)
        })
      })

      it('After changing time range shows correct options', () => {
        cy.cs('FromYearSelector').click()
        cy.cs('FromYearSelectorOption2016-2017').click()
        cy.cs('FromYearSelectorOption2016-2017').should('have.class', 'Mui-selected')
        clickAway()

        cy.cs('ToYearSelector').click()
        cy.cs('ToYearSelectorOption2019-2020').click()
        cy.cs('ToYearSelectorOption2019-2020').should('have.class', 'Mui-selected')
        clickAway()

        cy.cs('FromYearSelector').click()
        cy.get('[data-cy^="FromYearSelectorOption"]').should('have.length', 21)
        clickAway()

        cy.cs('ToYearSelector').click()
        cy.get('[data-cy^="ToYearSelectorOption"]').should('have.length', 8)
        clickAway()

        cy.contains('Show population').should('be.enabled')
      })
    })

    it('If no data available, provider organization(s) select is disabled', () => {
      searchByCourseCode('TKT20014')
      cy.contains('TKT20014').click()

      cy.contains('TKT20014') //  Kypsyysnäyte LuK
      cy.contains('50037') // Ruotsinkielinen kypsyysnäyte LuK
      cy.contains('50036') // Suomenkielinen kypsyysnäyte LuK

      cy.cs('ProviderOrganizationSelect').click()

      cy.cs('ProviderOrganizationSelectOptionBoth').should('have.class', 'Mui-selected')
      cy.cs('ProviderOrganizationSelectOptionBoth').should('not.have.class', 'Mui-disabled')
      cy.cs('ProviderOrganizationSelectOptionBoth').should('have.text', 'University + Open university')

      cy.cs('ProviderOrganizationSelectOptionRegular').should('not.have.class', 'Mui-selected')
      cy.cs('ProviderOrganizationSelectOptionRegular').should('not.have.class', 'Mui-disabled')
      cy.cs('ProviderOrganizationSelectOptionRegular').should('have.text', 'University')
      cy.cs('ProviderOrganizationSelectOptionRegular').should('not.have.text', 'University (not available)')

      cy.cs('ProviderOrganizationSelectOptionOpen').should('not.have.class', 'Mui-selected')
      cy.cs('ProviderOrganizationSelectOptionOpen').should('have.class', 'Mui-disabled')
      cy.cs('ProviderOrganizationSelectOptionOpen').should('have.text', 'Open university (not available)')
      cy.cs('ProviderOrganizationSelectOptionOpen').should('not.have.text', 'University')
    })

    it('Has right to see all the students, because course rovider is TKT', () => {
      cy.visit('coursestatistics?courseCodes=%5B%22TKT10004%22%5D&separate=false')
      cy.cs('course-population-for-2021-2022').click()
      // cy.contains('Students (29)').click()
    })
  })
})

// TODO: Writing these as backend api tests
describe.skip('Only course statistics', () => {
  beforeEach(() => {
    cy.init('/coursestatistics', 'onlycoursestatistics')
    cy.url().should('include', '/coursestatistics')
  })

  it('Some features of Course Statistics are hidden for courseStatistics-users without other rights', () => {
    const coursecode = 'TKT10002'
    getCourseSearchHooksForSingleYear(coursecode)

    searchByCourseCode(coursecode)
    cy.wait('@courses').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.contains('tr', coursecode).click()

    cy.wait('@yearlystats').its('response.statusCode').should('be.oneOf', [200, 304])
    cy.url().should('contain', `courseCodes=%5B%22${coursecode}%22%5D`)

    cy.contains('Filter statistics by degree programmes').should('not.exist')
    cy.contains('Show population').should('not.exist')
    cy.contains('Faculty statistics').should('be.disabled')

    openAttemptsTab()
    const emptyYear = year => [year, 'NA', 'NA', 'NA', 'NA', 'NA']

    const attemptsTableContents = [
      // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
      ['Total *', 240, 212, 8, '96.36 %', 73],
      emptyYear('2023-2024'),
      ['2022-2023', 28, 27, 0, '96.43 %', 28],
      ['2021-2022', 45, 26, 0, '57.78 %', 45],
      ['2020-2021', 31, 31, 0, '100.00 %'],
      ['2019-2020', 56, 56, 0, '100.00 %'],
      ['2018-2019', 42, 39, 3, '92.86 %'],
      ['2017-2018', 32, 28, 4, '87.50 %'],
      ['2016-2017', 6, 5, 1, '83.33 %'],
      emptyYear('2015-2016'),
      emptyYear('2014-2015'),
      emptyYear('2013-2014'),
      emptyYear('2012-2013'),
      emptyYear('2011-2012'),
      emptyYear('2010-2011'),
      emptyYear('2009-2010'),
      emptyYear('2008-2009'),
      emptyYear('2007-2008'),
      emptyYear('2006-2007'),
      emptyYear('2005-2006'),
      emptyYear('2004-2005'),
      emptyYear('2003-2004'),
      emptyYear('2002-2003'),
      emptyYear('2001-2002'),
      emptyYear('2000-2001'),
      emptyYear('1999-2000'),
    ]

    openAttemptsTab()
    checkTableContents(attemptsTableContents)
  })
})
