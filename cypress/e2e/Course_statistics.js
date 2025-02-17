/// <reference types="cypress" />

// TODO: Test the pass rate and grade distribution charts and the Show relative toggle
// TODO: Test Export to Excel (assert that the file was downloaded, see other tests for examples)
// TODO: Test population link status (should be disabled for empty rows)
// TODO: Test Enrolled, no grade being null for years before Sisu era (currently displays 0 for empty)

const checkGradeTable = gradesTableContents => {
  cy.cs('Grade distribution')
    .parent()
    .siblings('.content.active')
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
}

const checkTableContents = contents => {
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

describe('Course Statistics tests', () => {
  describe('When using basic user', () => {
    beforeEach(() => {
      cy.init('/coursestatistics')
      cy.url().should('include', '/coursestatistics')
    })

    describe('It shows correct statistics for courses with other grades than 0-5', () => {
      it('Shows correct statistics for courses with scale HT-TT', () => {
        const gradesTableContents = [
          [null, 'TT', 176],
          [null, 'No grade', 10],
          [null, 'Hyl.', 5],
          [null, 'HT', 177],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('KK-RUKIRJ')
        cy.contains('td', /^KK-RUKIRJ,/).click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('KK-RUKIRJ • Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains('AYKK-RUKIRJ • Avoin yo: Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains('KK-RULAAK2 • Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains(
          'KK-RUHYK • Helsingin yliopistossa toiseen tutkintoon suoritettu toisen kotimaisen kielen kirjallinen taito, ruotsi'
        )
        cy.contains('992912 • Toisen kotimaisen kielen kirjallinen taito, ruotsi')
        cy.contains('A992912 • Avoin yo: Toisen kotimaisen kielen kirjallinen taito, ruotsi')
        cy.contains('2004-2005')
        cy.contains('Show population').should('be.disabled')
        cy.contains('Show population').trigger('mouseover', { force: true })
        cy.contains('The maximum time range to generate a population for this course is 17 years')
        cy.contains('Show population').trigger('mouseleave', { force: true })
        selectFromYear('2019-2020')
        cy.contains('Show population').click()
        cy.contains(
          'Population of course Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1) 2019-2024 (open and normal)'
        )
        cy.contains('368 students out of 368 shown')
        checkGradeTable(gradesTableContents)
      })

      it("Shows correct statistics for old master's thesis grade scales", () => {
        const gradesTableContents = [
          [null, 'NSLA', 1],
          [null, 'L', 3],
          [null, 'ECLA', 5],
          [null, 'CL', 1],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('50131')
        cy.contains('td', '50131').click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('50131 • Pro gradu -tutkielma tietojenkäsittelytieteessä')
        cy.contains('Show population').should('be.enabled').click()
        cy.contains('Population of course Pro gradu -tutkielma tietojenkäsittelytieteessä 2007-2020 (open and normal)')
        cy.contains('10 students out of 10 shown')
        checkGradeTable(gradesTableContents)
      })

      it('Shows correct statistics for courses with scale passed-failed', () => {
        const gradesTableContents = [
          [null, 'Hyv.', 3],
          [null, 'Hyl.', 1],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('200012')
        cy.contains('td', '200012').click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains(
          'ON-310 • Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot'
        )
        cy.contains('200012 • Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot')
        cy.contains('Show population').should('be.enabled').click()
        cy.contains(
          'Population of course Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot 2011-2018 (open and normal)'
        )
        cy.contains('4 students out of 4 shown')
        checkGradeTable(gradesTableContents)
      })
    })

    it('Searching single course having substitution mappings shows course statistics', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20001')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('Search for courses').should('not.exist')

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
      cy.contains('Search for courses')
      cy.cs('select-multiple-courses-toggle').should('not.have.class', 'Mui-checked').click()
      cy.cs('select-multiple-courses-toggle').should('have.class', 'Mui-checked')
      searchByCourseCode('TKT')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('td', /^TKT10002/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      openSummaryTab()
      cy.contains('Tietorakenteet ja algoritmit').click()
      cy.contains('Ohjelmoinnin perusteet').should('not.exist')
      cy.contains('TKT20001')
      cy.contains('58131')

      openSummaryTab()
      cy.contains('Ohjelmoinnin perusteet').click()
      cy.contains('Käyttöjärjestelmät').should('not.exist')
      cy.contains('TKT10002')
      cy.contains('581325')
      openSummaryTab()

      clickNewQueryButton()
      cy.contains('Search for courses')
    })

    it('On searches with multiple courses, has correct links on the Course tab', () => {
      cy.cs('select-multiple-courses-toggle').click()
      searchByCourseCode('TKT')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('td', /^TKT10002/).click()
      cy.contains('Fetch statistics').click()
      cy.contains('Search for courses').should('not.exist')

      cy.cs('course-population-for-2023-2024').click()
      cy.contains('Population of course Introduction to Programming 2023-2024 (open and normal)')

      cy.go('back')
      cy.cs('CourseSelector').click()
      cy.cs('CourseSelectorOptionTKT20001').click()
      cy.cs('course-population-for-2022-2023').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit')
    })

    it('On consecutive searches should not crash and search should work', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20003')
      cy.contains('td', 'TKT20003').click()
      cy.contains('Show population')
      cy.contains('TKT20003')

      cy.contains('Courses').click()
      cy.contains('Search for courses')
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001').click()
      cy.contains('Show population')
      cy.contains('TKT20001')
    })

    it('Searching course by name displays right courses', () => {
      cy.contains('Search for courses')
      searchByCourseName('tietokantojen perusteet')

      cy.contains('Tietokantojen perusteet')
      cy.contains('td', 'TKT10004, BSCS2001, 581328, A581328, AYTKT10004').click()

      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT10004 • Tietokantojen perusteet')
      cy.contains('AYTKT10004 • Avoin yo: Tietokantojen perusteet')
      cy.contains('BSCS2001 • Introduction to Databases')
      cy.contains('581328 • Tietokantojen perusteet')
      cy.contains('A581328 • Avoin yo: Tietokantojen perusteet')
      clickNewQueryButton()
      cy.contains('Please enter at least 5 characters for course name or 2 characters for course code.')
    })

    it('"Select all search results" button is not showing unless "Select multiple courses" toggle is on', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT')
      cy.cs('select-multiple-courses-toggle').should('not.have.class', 'Mui-checked')
      cy.contains('TKT10004, BSCS2001, 581328, A581328, AYTKT10004')
      cy.contains('Select all search results').should('not.exist')
      cy.cs('select-multiple-courses-toggle').click()
      cy.cs('select-multiple-courses-toggle').should('have.class', 'Mui-checked')
      cy.contains('Select all search results')
    })

    it('Provider organization select works', () => {
      cy.contains('Search for courses')
      searchByCourseName('tietokantojen perusteet')

      cy.contains('td', /^TKT10004/).click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT10004 • Tietokantojen perusteet')
      cy.contains('AYTKT10004 • Avoin yo: Tietokantojen perusteet')
      cy.contains('BSCS2001 • Introduction to Databases')
      cy.contains('581328 • Tietokantojen perusteet')
      cy.contains('A581328 • Avoin yo: Tietokantojen perusteet')

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

    it('Searching course by name displays right courses, 10 credit courses', { retries: 2 }, () => {
      cy.contains('Search for courses')
      searchByCourseName('tietorakenteet ja algoritmit')
      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT20001 • Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 • Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 • Data Structures and Algorithms')
      cy.contains('58131 • Tietorakenteet')
      clickNewQueryButton()
      cy.contains('Please enter at least 5 characters for course name or 2 characters for course code.')
      searchByCourseName('tietorakenteet ja algoritmit')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()

      cy.contains('Search for courses').should('not.exist')
      cy.contains('TKT20001 • Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 • Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 • Data Structures and Algorithms')
      cy.contains('58131 • Tietorakenteet')
    })

    it('Can find course population', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20003')
      cy.contains('tr', 'TKT20003').click()
      cy.contains('TKT20003 • Käyttöjärjestelmät')
      cy.contains('582219 • Käyttöjärjestelmät')
      cy.cs('course-population-for-2020-2021').click()
      cy.contains('Population of course Käyttöjärjestelmät 2020-2021 (open and normal')
      cy.contains('TKT20003')

      cy.contains('Students (19)').click()
      cy.contains('394776')
      cy.contains('416369')
    })

    it('Population of course shows grades for each student', () => {
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('TKT20001 • Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 • Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 • Data Structures and Algorithms')
      cy.contains('58131 • Tietorakenteet')
      cy.cs('course-population-for-2019-2020').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit 2019-2020 (open and normal)')
      cy.contains('Students (33)').click()
      cy.contains('td', '394776').siblings().eq(2).contains('3')
      cy.contains('td', '497388').siblings().eq(2).contains('2')
    })

    it("In 'Course population' view, student numbers of students that the user isn't allowed to see are hidden", () => {
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('TKT20001 • Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 • Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 • Data Structures and Algorithms')
      cy.contains('58131 • Tietorakenteet')
      cy.cs('course-population-for-2019-2020').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit 2019-2020 (open and normal)')
      cy.contains('Students (33)').click()
      cy.get('table tbody td').filter(':contains("hidden")').should('have.length', 9)
    })

    it('Language distribution is correct', () => {
      searchByCourseCode('TKT20003')
      cy.contains('td', 'TKT20003, 582219').click()
      cy.contains('TKT20003 • Käyttöjärjestelmät')
      cy.contains('582219 • Käyttöjärjestelmät')
      cy.cs('course-population-for-2021-2022').click()
      cy.contains('Population of course Käyttöjärjestelmät 2021-2022 (open and normal)')
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
          cy.contains('td', /^TKT10002$/).click()
          cy.contains('Search for courses').should('not.exist')
          cy.contains('TKT10002 • Ohjelmoinnin perusteet')
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

        describe('Students tab', () => {
          describe('Info boxes', () => {
            it('Student statistics table', () => {
              cy.cs('StudentStatisticsInfoBoxButton').click()
              cy.cs('StudentStatisticsInfoBoxContent').contains('Table - Students')
            })

            it('Pass rate', () => {
              cy.cs('PassRateStudentsInfoBoxButton').click()
              cy.cs('PassRateStudentsInfoBoxContent').contains('Pass rate - Students')
            })

            it('Grade distribution', () => {
              toggleShowGrades()
              cy.cs('GradeDistributionInfoBoxButton').click()
              cy.cs('GradeDistributionInfoBoxContent').contains('Grade distribution')
            })
          })

          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', 187, 140, 11, 36, '74.87 %', '25.13 %'],
              ['2023-2024', 7, 1, 0, 6, '14.29 %', '85.71 %'],
              ['2022-2023', 33, 27, 0, 6, '81.82 %', '18.18 %'],
              ['2021-2022', 39, 15, 0, 24, '38.46 %', '61.54 %'],
              ['2020-2021', 23, 23, 0, null, '100.00 %', '0.00 %'],
              ['2019-2020', 28, 28, 0, null, '100.00 %', '0.00 %'],
              ['2018-2019', 30, 26, 4, null, '86.67 %', '13.33 %'],
              ['2017-2018', 26, 19, 7, null, '73.08 %', '26.92 %'],
              ['2016-2017', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', 191, 140, 13, 38, '73.30 %', '26.70 %'],
              ['Syksy 2023', 7, 1, 0, 6, '14.29 %', '85.71 %'],
              ['Kevät 2023', 10, 9, 0, 1, '90.00 %', '10.00 %'],
              ['Syksy 2022', 23, 18, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', 26, 9, 0, 17, '34.62 %', '65.38 %'],
              ['Syksy 2021', 15, 6, 0, 9, '40.00 %', '60.00 %'],
              ['Kevät 2021', 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', 19, 19, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', 25, 24, 1, null, '96.00 %', '4.00 %'],
              ['Kevät 2019', 8, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2018', 22, 18, 4, null, '81.82 %', '18.18 %'],
              ['Kevät 2018', 19, 12, 7, null, '63.16 %', '36.84 %'],
              ['Syksy 2017', 8, 7, 1, null, '87.50 %', '12.50 %'],
              ['Kevät 2017', 0, 0, 0, null, '–', '–'],
              ['Syksy 2016', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', 187, 11, 3, 8, 5, 24, 99, 1, 36, '74.87 %', '25.13 %'],
              ['2023-2024', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
              ['2022-2023', 33, 0, 0, 0, 0, 6, 21, 0, 6, '81.82 %', '18.18 %'],
              ['2021-2022', 39, 0, 0, 0, 0, 2, 13, 0, 24, '38.46 %', '61.54 %'],
              ['2020-2021', 23, 0, 0, 2, 0, 2, 18, 1, null, '100.00 %', '0.00 %'],
              ['2019-2020', 28, 0, 1, 4, 1, 5, 17, 0, null, '100.00 %', '0.00 %'],
              ['2018-2019', 30, 4, 2, 1, 2, 3, 18, 0, null, '86.67 %', '13.33 %'],
              ['2017-2018', 26, 7, 0, 1, 2, 5, 11, 0, null, '73.08 %', '26.92 %'],
              ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', 191, 13, 3, 8, 5, 24, 99, 1, 38, '73.30 %', '26.70 %'],
              ['Syksy 2023', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
              ['Kevät 2023', 10, 0, 0, 0, 0, 3, 6, 0, 1, '90.00 %', '10.00 %'],
              ['Syksy 2022', 23, 0, 0, 0, 0, 3, 15, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', 26, 0, 0, 0, 0, 2, 7, 0, 17, '34.62 %', '65.38 %'],
              ['Syksy 2021', 15, 0, 0, 0, 0, 0, 6, 0, 9, '40.00 %', '60.00 %'],
              ['Kevät 2021', 4, 0, 0, 0, 0, 0, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', 19, 0, 0, 2, 0, 2, 14, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', 4, 0, 1, 0, 1, 0, 2, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', 25, 1, 0, 4, 0, 5, 15, 0, null, '96.00 %', '4.00 %'],
              ['Kevät 2019', 8, 0, 0, 0, 1, 1, 6, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2018', 22, 4, 2, 1, 1, 2, 12, 0, null, '81.82 %', '18.18 %'],
              ['Kevät 2018', 19, 7, 0, 1, 0, 3, 8, 0, null, '63.16 %', '36.84 %'],
              ['Syksy 2017', 8, 1, 0, 0, 2, 2, 3, 0, null, '87.50 %', '12.50 %'],
              ['Kevät 2017', 0, 0, 0, 0, 0, 0, 0, 0, null, '–', '–'],
              ['Syksy 2016', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })
        })

        describe('Attempts tab', () => {
          beforeEach(() => {
            openAttemptsTab()
          })

          describe('Info boxes', () => {
            it('Attempt statistics table', () => {
              cy.cs('AttemptStatisticsInfoBoxButton').click()
              cy.cs('AttemptStatisticsInfoBoxContent').contains('Table - Attempts')
            })

            it('Pass rate', () => {
              cy.cs('PassRateAttemptsInfoBoxButton').click()
              cy.cs('PassRateAttemptsInfoBoxContent').contains('Pass rate - Attempts')
            })

            it('Grade distribution', () => {
              toggleShowGrades()
              cy.cs('GradeDistributionInfoBoxButton').click()
              cy.cs('GradeDistributionInfoBoxContent').contains('Grade distribution')
            })
          })

          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', 186, 140, 16, '89.74 %', 73],
              ['2023-2024', 6, 1, 0, '16.67 %', 6],
              ['2022-2023', 26, 27, 0, '100.00 %', 26],
              ['2021-2022', 41, 15, 0, '36.59 %', 41],
              ['2020-2021', 23, 23, 0, '100.00 %', null],
              ['2019-2020', 29, 28, 1, '96.55 %', null],
              ['2018-2019', 32, 26, 6, '81.25 %', null],
              ['2017-2018', 28, 19, 9, '67.86 %', null],
              ['2016-2017', 1, 1, 0, '100.00 %', null],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', 186, 140, 16, '89.74 %', 73],
              ['Syksy 2023', 6, 1, 0, '16.67 %', 6],
              ['Kevät 2023', 11, 9, 0, '81.82 %', 11],
              ['Syksy 2022', 15, 18, 0, '100.00 %', 15],
              ['Kevät 2022', 29, 9, 0, '31.03 %', 29],
              ['Syksy 2021', 12, 6, 0, '50.00 %', 12],
              ['Kevät 2021', 4, 4, 0, '100.00 %', null],
              ['Syksy 2020', 19, 19, 0, '100.00 %', null],
              ['Kevät 2020', 4, 4, 0, '100.00 %', null],
              ['Syksy 2019', 25, 24, 1, '96.00 %', null],
              ['Kevät 2019', 8, 8, 0, '100.00 %', null],
              ['Syksy 2018', 24, 18, 6, '75.00 %', null],
              ['Kevät 2018', 20, 12, 8, '60.00 %', null],
              ['Syksy 2017', 8, 7, 1, '87.50 %', null],
              ['Kevät 2017', 0, 0, 0, '–', 0],
              ['Syksy 2016', 1, 1, 0, '100.00 %', null],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', 186, 16, 3, 8, 5, 24, 99, 1],
              ['2023-2024', 6, 0, 0, 0, 0, 0, 1, 0],
              ['2022-2023', 26, 0, 0, 0, 0, 6, 21, 0],
              ['2021-2022', 41, 0, 0, 0, 0, 2, 13, 0],
              ['2020-2021', 23, 0, 0, 2, 0, 2, 18, 1],
              ['2019-2020', 29, 1, 1, 4, 1, 5, 17, 0],
              ['2018-2019', 32, 6, 2, 1, 2, 3, 18, 0],
              ['2017-2018', 28, 9, 0, 1, 2, 5, 11, 0],
              ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', 186, 16, 3, 8, 5, 24, 99, 1],
              ['Syksy 2023', 6, 0, 0, 0, 0, 0, 1, 0],
              ['Kevät 2023', 11, 0, 0, 0, 0, 3, 6, 0],
              ['Syksy 2022', 15, 0, 0, 0, 0, 3, 15, 0],
              ['Kevät 2022', 29, 0, 0, 0, 0, 2, 7, 0],
              ['Syksy 2021', 12, 0, 0, 0, 0, 0, 6, 0],
              ['Kevät 2021', 4, 0, 0, 0, 0, 0, 4, 0],
              ['Syksy 2020', 19, 0, 0, 2, 0, 2, 14, 1],
              ['Kevät 2020', 4, 0, 1, 0, 1, 0, 2, 0],
              ['Syksy 2019', 25, 1, 0, 4, 0, 5, 15, 0],
              ['Kevät 2019', 8, 0, 0, 0, 1, 1, 6, 0],
              ['Syksy 2018', 24, 6, 2, 1, 1, 2, 12, 0],
              ['Kevät 2018', 20, 8, 0, 1, 0, 3, 8, 0],
              ['Syksy 2017', 8, 1, 0, 0, 2, 2, 3, 0],
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
          cy.contains('td', /^TKT10002, BSCS1001, 581325, A581325, AYTKT10002$/).click()
          cy.contains('Search for courses').should('not.exist')
          cy.contains('TKT10002 • Ohjelmoinnin perusteet')
          cy.contains('AYTKT10002 • Avoin yo: Ohjelmoinnin perusteet')
          cy.contains('BSCS1001 • Introduction to Programming')
          cy.contains('581325 • Ohjelmoinnin perusteet')
          cy.contains('A581325 • Avoin yo: Ohjelmoinnin perusteet')
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

        describe('Students tab', () => {
          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', 284, 237, 16, 31, '83.45 %', '16.55 %'],
              ['2023-2024', 8, 2, 0, 6, '25.00 %', '75.00 %'],
              ['2022-2023', 35, 28, 0, 7, '80.00 %', '20.00 %'],
              ['2021-2022', 45, 27, 0, 18, '60.00 %', '40.00 %'],
              ['2020-2021', 33, 33, 0, null, '100.00 %', '0.00 %'],
              ['2019-2020', 57, 56, 1, null, '98.25 %', '1.75 %'],
              ['2018-2019', 42, 38, 4, null, '90.48 %', '9.52 %'],
              ['2017-2018', 32, 25, 7, null, '78.13 %', '21.88 %'],
              ['2016-2017', 7, 6, 1, null, '85.71 %', '14.29 %'],
              ['2015-2016', 4, 3, 1, null, '75.00 %', '25.00 %'],
              ['2014-2015', 6, 6, 0, null, '100.00 %', '0.00 %'],
              ['2013-2014', 2, 1, 1, null, '50.00 %', '50.00 %'],
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
              ['Total', 293, 239, 19, 35, '81.57 %', '18.43 %'],
              ['Syksy 2023', 8, 2, 0, 6, '25.00 %', '75.00 %'],
              ['Kevät 2023', 12, 10, 0, 2, '83.33 %', '16.67 %'],
              ['Syksy 2022', 23, 18, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', 28, 11, 0, 17, '39.29 %', '60.71 %'],
              ['Syksy 2021', 21, 16, 0, 5, '76.19 %', '23.81 %'],
              ['Kevät 2021', 8, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', 25, 25, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', 26, 26, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', 33, 31, 2, null, '93.94 %', '6.06 %'],
              ['Kevät 2019', 17, 16, 1, null, '94.12 %', '5.88 %'],
              ['Syksy 2018', 27, 23, 4, null, '85.19 %', '14.81 %'],
              ['Kevät 2018', 24, 17, 7, null, '70.83 %', '29.17 %'],
              ['Syksy 2017', 9, 8, 1, null, '88.89 %', '11.11 %'],
              ['Kevät 2017', 4, 3, 1, null, '75.00 %', '25.00 %'],
              ['Syksy 2016', 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2016', 3, 2, 1, null, '66.67 %', '33.33 %'],
              ['Syksy 2015', 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2015', 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2014', 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2014', 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2013', 1, 0, 1, null, '0.00 %', '100.00 %'],
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
              ['Total', 284, 16, 4, 14, 9, 37, 168, 5, 31, '83.45 %', '16.55 %'],
              ['2023-2024', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
              ['2022-2023', 35, 0, 0, 0, 0, 6, 22, 0, 7, '80.00 %', '20.00 %'],
              ['2021-2022', 45, 0, 0, 1, 0, 2, 24, 0, 18, '60.00 %', '40.00 %'],
              ['2020-2021', 33, 0, 0, 2, 1, 2, 27, 1, null, '100.00 %', '0.00 %'],
              ['2019-2020', 57, 1, 1, 5, 3, 9, 38, 0, null, '98.25 %', '1.75 %'],
              ['2018-2019', 42, 4, 3, 2, 2, 6, 25, 0, null, '90.48 %', '9.52 %'],
              ['2017-2018', 32, 7, 0, 2, 2, 6, 15, 0, null, '78.13 %', '21.88 %'],
              ['2016-2017', 7, 1, 0, 0, 1, 1, 4, 0, null, '85.71 %', '14.29 %'],
              ['2015-2016', 4, 1, 0, 1, 0, 0, 1, 1, null, '75.00 %', '25.00 %'],
              ['2014-2015', 6, 0, 0, 1, 0, 0, 2, 3, null, '100.00 %', '0.00 %'],
              ['2013-2014', 2, 1, 0, 0, 0, 0, 1, 0, null, '50.00 %', '50.00 %'],
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
              ['Total', 293, 19, 5, 15, 9, 37, 168, 5, 35, '81.57 %', '18.43 %'],
              ['Syksy 2023', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
              ['Kevät 2023', 12, 0, 0, 0, 0, 3, 7, 0, 2, '83.33 %', '16.67 %'],
              ['Syksy 2022', 23, 0, 0, 0, 0, 3, 15, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', 28, 0, 0, 0, 0, 2, 9, 0, 17, '39.29 %', '60.71 %'],
              ['Syksy 2021', 21, 0, 0, 1, 0, 0, 15, 0, 5, '76.19 %', '23.81 %'],
              ['Kevät 2021', 8, 0, 0, 0, 0, 0, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', 25, 0, 0, 2, 1, 2, 19, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', 26, 0, 1, 1, 2, 4, 18, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', 33, 2, 1, 4, 1, 5, 20, 0, null, '93.94 %', '6.06 %'],
              ['Kevät 2019', 17, 1, 1, 1, 1, 2, 11, 0, null, '94.12 %', '5.88 %'],
              ['Syksy 2018', 27, 4, 2, 2, 1, 4, 14, 0, null, '85.19 %', '14.81 %'],
              ['Kevät 2018', 24, 7, 0, 2, 0, 4, 11, 0, null, '70.83 %', '29.17 %'],
              ['Syksy 2017', 9, 1, 0, 0, 2, 2, 4, 0, null, '88.89 %', '11.11 %'],
              ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0, null, '75.00 %', '25.00 %'],
              ['Syksy 2016', 3, 0, 0, 0, 0, 1, 2, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2016', 3, 1, 0, 1, 0, 0, 1, 0, null, '66.67 %', '33.33 %'],
              ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2015', 3, 0, 0, 0, 0, 0, 0, 3, null, '100.00 %', '0.00 %'],
              ['Syksy 2014', 3, 0, 0, 1, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2013', 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
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

        describe('Attempts tab', () => {
          beforeEach(() => {
            openAttemptsTab()
          })

          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', 288, 241, 25, '90.60 %', 79],
              ['2023-2024', 6, 2, 0, '33.33 %', 6],
              ['2022-2023', 28, 28, 0, '100.00 %', 28],
              ['2021-2022', 45, 27, 0, '60.00 %', 45],
              ['2020-2021', 34, 34, 0, '100.00 %', null],
              ['2019-2020', 60, 57, 3, '95.00 %', null],
              ['2018-2019', 46, 39, 7, '84.78 %', null],
              ['2017-2018', 35, 26, 9, '74.29 %', null],
              ['2016-2017', 7, 6, 1, '85.71 %', null],
              ['2015-2016', 5, 3, 2, '60.00 %', null],
              ['2014-2015', 7, 6, 1, '85.71 %', null],
              ['2013-2014', 2, 1, 1, '50.00 %', null],
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
              ['Total', 288, 241, 25, '90.60 %', 79],
              ['Syksy 2023', 6, 2, 0, '33.33 %', 6],
              ['Kevät 2023', 13, 10, 0, '76.92 %', 13],
              ['Syksy 2022', 15, 18, 0, '100.00 %', 15],
              ['Kevät 2022', 30, 11, 0, '36.67 %', 30],
              ['Syksy 2021', 15, 16, 0, '100.00 %', 15],
              ['Kevät 2021', 8, 8, 0, '100.00 %', null],
              ['Syksy 2020', 26, 26, 0, '100.00 %', null],
              ['Kevät 2020', 26, 26, 0, '100.00 %', null],
              ['Syksy 2019', 34, 31, 3, '91.18 %', null],
              ['Kevät 2019', 17, 16, 1, '94.12 %', null],
              ['Syksy 2018', 29, 23, 6, '79.31 %', null],
              ['Kevät 2018', 26, 18, 8, '69.23 %', null],
              ['Syksy 2017', 9, 8, 1, '88.89 %', null],
              ['Kevät 2017', 4, 3, 1, '75.00 %', null],
              ['Syksy 2016', 3, 3, 0, '100.00 %', null],
              ['Kevät 2016', 4, 2, 2, '50.00 %', null],
              ['Syksy 2015', 1, 1, 0, '100.00 %', null],
              ['Kevät 2015', 4, 3, 1, '75.00 %', null],
              ['Syksy 2014', 3, 3, 0, '100.00 %', null],
              ['Kevät 2014', 1, 1, 0, '100.00 %', null],
              ['Syksy 2013', 1, 0, 1, '0.00 %', null],
              ['Kevät 2013', 0, 0, 0, '–', 0],
              ['Syksy 2012', 4, 4, 0, '100.00 %', null],
              ['Kevät 2012', 1, 1, 0, '100.00 %', null],
              ['Syksy 2011', 0, 0, 0, '–', 0],
              ['Kevät 2011', 1, 1, 0, '100.00 %', null],
              ['Syksy 2010', 0, 0, 0, '–', 0],
              ['Kevät 2010', 0, 0, 0, '–', 0],
              ['Syksy 2009', 0, 0, 0, '–', 0],
              ['Kevät 2009', 0, 0, 0, '–', 0],
              ['Syksy 2008', 1, 0, 1, '0.00 %', null],
              ['Kevät 2008', 1, 1, 0, '100.00 %', null],
              ['Syksy 2007', 0, 0, 0, '–', 0],
              ['Kevät 2007', 1, 1, 0, '100.00 %', null],
              ['Syksy 2006', 0, 0, 0, '–', 0],
              ['Kevät 2006', 0, 0, 0, '–', 0],
              ['Syksy 2005', 1, 1, 0, '100.00 %', null],
              ['Kevät 2005', 0, 0, 0, '–', 0],
              ['Syksy 2004', 0, 0, 0, '–', 0],
              ['Kevät 2004', 1, 1, 0, '100.00 %', null],
              ['Syksy 2003', 0, 0, 0, '–', 0],
              ['Kevät 2003', 0, 0, 0, '–', 0],
              ['Syksy 2002', 0, 0, 0, '–', 0],
              ['Kevät 2002', 0, 0, 0, '–', 0],
              ['Syksy 2001', 0, 0, 0, '–', 0],
              ['Kevät 2001', 0, 0, 0, '–', 0],
              ['Syksy 2000', 0, 0, 0, '–', 0],
              ['Kevät 2000', 0, 0, 0, '–', 0],
              ['Syksy 1999', 2, 2, 0, '100.00 %', null],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', 288, 25, 6, 15, 9, 37, 169, 5],
              ['2023-2024', 6, 0, 0, 0, 0, 0, 2, 0],
              ['2022-2023', 28, 0, 0, 0, 0, 6, 22, 0],
              ['2021-2022', 45, 0, 0, 1, 0, 2, 24, 0],
              ['2020-2021', 34, 0, 0, 2, 1, 2, 28, 1],
              ['2019-2020', 60, 3, 2, 5, 3, 9, 38, 0],
              ['2018-2019', 46, 7, 3, 3, 2, 6, 25, 0],
              ['2017-2018', 35, 9, 1, 2, 2, 6, 15, 0],
              ['2016-2017', 7, 1, 0, 0, 1, 1, 4, 0],
              ['2015-2016', 5, 2, 0, 1, 0, 0, 1, 1],
              ['2014-2015', 7, 1, 0, 1, 0, 0, 2, 3],
              ['2013-2014', 2, 1, 0, 0, 0, 0, 1, 0],
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
              ['Total', 288, 25, 6, 15, 9, 37, 169, 5],
              ['Syksy 2023', 6, 0, 0, 0, 0, 0, 2, 0],
              ['Kevät 2023', 13, 0, 0, 0, 0, 3, 7, 0],
              ['Syksy 2022', 15, 0, 0, 0, 0, 3, 15, 0],
              ['Kevät 2022', 30, 0, 0, 0, 0, 2, 9, 0],
              ['Syksy 2021', 15, 0, 0, 1, 0, 0, 15, 0],
              ['Kevät 2021', 8, 0, 0, 0, 0, 0, 8, 0],
              ['Syksy 2020', 26, 0, 0, 2, 1, 2, 20, 1],
              ['Kevät 2020', 26, 0, 1, 1, 2, 4, 18, 0],
              ['Syksy 2019', 34, 3, 1, 4, 1, 5, 20, 0],
              ['Kevät 2019', 17, 1, 1, 1, 1, 2, 11, 0],
              ['Syksy 2018', 29, 6, 2, 2, 1, 4, 14, 0],
              ['Kevät 2018', 26, 8, 1, 2, 0, 4, 11, 0],
              ['Syksy 2017', 9, 1, 0, 0, 2, 2, 4, 0],
              ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0],
              ['Syksy 2016', 3, 0, 0, 0, 0, 1, 2, 0],
              ['Kevät 2016', 4, 2, 0, 1, 0, 0, 1, 0],
              ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1],
              ['Kevät 2015', 4, 1, 0, 0, 0, 0, 0, 3],
              ['Syksy 2014', 3, 0, 0, 1, 0, 0, 2, 0],
              ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0],
              ['Syksy 2013', 1, 1, 0, 0, 0, 0, 0, 0],
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

        cy.contains('TKT20014 • Kypsyysnäyte LuK')
        cy.contains('50037 • Ruotsinkielinen kypsyysnäyte LuK')
        cy.contains('50036 • Suomenkielinen kypsyysnäyte LuK')

        cy.cs('ProviderOrganizationSelect').click()

        cy.cs('ProviderOrganizationSelectOptionBoth').should('have.class', 'Mui-selected')
        cy.cs('ProviderOrganizationSelectOptionBoth').should('not.have.class', 'Mui-disabled')
        cy.cs('ProviderOrganizationSelectOptionBoth').should('have.text', 'Both')

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
        cy.contains('Students (29)').click()
        cy.contains('509781')
        cy.contains('529866')
      })
    })
  })

  it('Some features of Course Statistics are hidden for courseStatistics-users without other rights', () => {
    cy.init('/coursestatistics', 'onlycoursestatistics')
    cy.cs('nav-bar-button-courseStatistics').click()
    cy.cs('course-code-input').type('TKT10002')
    cy.contains('tr', 'TKT10002').click()
    cy.contains('Filter statistics by study programmes').should('not.exist')
    cy.contains('Faculty statistics').should('not.exist')
    cy.contains('Show population').should('not.exist')
    openAttemptsTab()

    const emptyYear = year => [year, 'NA', 'NA', 'NA', 'NA', 'NA']

    const attemptsTableContents = [
      // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
      ['Total *', 255, 217, 20, '91.56 %', 73],
      emptyYear('2023-2024'),
      ['2022-2023', 28, 28, 0, '100.00 %', 28],
      ['2021-2022', 45, 27, 0, '60.00 %', 45],
      ['2020-2021', 34, 34, 0, '100.00 %'],
      ['2019-2020', 60, 57, 3, '95.00 %'],
      ['2018-2019', 46, 39, 7, '84.78 %'],
      ['2017-2018', 35, 26, 9, '74.29 %'],
      ['2016-2017', 7, 6, 1, '85.71 %'],
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
