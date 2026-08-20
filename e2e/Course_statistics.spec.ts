import { expect, Page, test } from '@playwright/test'
import { init } from './support/commands'

// TODO: Test the pass rate and grade distribution charts and the Show relative toggle
// TODO: Test Export to Excel (assert that the file was downloaded, see other tests for examples)
// TODO: Test population link status (should be disabled for empty rows)

const checkGradeTable = async (page: Page, gradesTableContents: (string | number | null)[][]) => {
  await page.getByTestId('Grade distribution').click()

  const rows = page.getByTestId('Grade distribution-data').locator('table > tbody').first().locator('tr')
  await expect(rows.locator('td')).toContainText(
    gradesTableContents.flatMap(values => values.map(value => (value === null ? '' : String(value))))
  )
  await expect(rows).toHaveCount(gradesTableContents.length)
}

const checkTableContents = async (page: Page, contents: (string | number | null)[][]) => {
  const rows = page.locator('table tbody').locator('tr')
  await expect(rows.locator('td')).toHaveText(
    contents.flatMap(values => values.map(value => (value === null ? '' : String(value))))
  )
  await expect(rows).toHaveCount(contents.length)
}

const toggleShowGrades = async (page: Page) => {
  await page.getByTestId('gradeToggle').click()
}

const toggleSeparateBySemesters = async (page: Page) => {
  await page.getByTestId('separateToggle').click()
}

const openStudentsTab = async (page: Page) => {
  await page.getByTestId('StudentsTab').click()
}

const openAttemptsTab = async (page: Page) => {
  await page.getByTestId('AttemptsTab').click()
}

const searchByCourseName = async (page: Page, courseName: string) => {
  await page.getByPlaceholder('Search by course name').fill(courseName)
}

const searchByCourseCode = async (page: Page, courseCode: string) => {
  await page.getByPlaceholder('Search by course code').fill(courseCode)
}

const clickNewQueryButton = async (page: Page) => {
  await page.getByTestId('NewQueryButton').click()
}

const selectFromYear = async (page: Page, year: string) => {
  await page.getByTestId('FromYearSelector').click()
  await page.getByTestId(`FromYearSelectorOption${year}`).click()
}

const openSummaryTab = async (page: Page) => {
  await page.getByTestId('SummaryTab').click()
}

const clickAway = async (page: Page) => {
  await page.locator('body').click({ position: { x: 0, y: 0 } })
}

test.describe('Basic user', () => {
  test.beforeEach(async ({ page }) => {
    await init(page, '/coursestatistics')
    await expect(page).toHaveURL('/coursestatistics')
  })

  test('Search should work on consecutive searches', async ({ page }) => {
    const courseCode1 = 'TKT20003'
    await searchByCourseCode(page, courseCode1)
    await page.getByTestId(`course-${courseCode1}`).click()

    await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([courseCode1]))

    await expect(page.getByRole('button', { name: 'Show population' })).toBeEnabled()
    await page.getByRole('button', { name: 'Show population' }).click()

    await expect(page.getByRole('heading', { name: courseCode1 })).toBeVisible()

    await page.getByTestId('nav-bar-button-courseStatistics').click()

    const courseCode2 = 'TKT20001'
    await searchByCourseCode(page, courseCode2)
    await page.getByTestId(`course-${courseCode2}`).click()

    await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([courseCode2]))

    await expect(page.getByRole('button', { name: 'Show population' })).toBeEnabled()
    await page.getByRole('button', { name: 'Show population' }).click()

    await expect(page.getByText(courseCode2, { exact: true })).toBeVisible()
  })

  test.describe('Course table can show non-standard grades', () => {
    test('Course table can show HT-TT grade scales', async ({ page }) => {
      const coursecode = 'KK-RUKIRJ'
      await searchByCourseCode(page, coursecode)
      await page.getByTestId(`course-${coursecode}`).click()

      await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([coursecode]))

      await selectFromYear(page, '2019-2020')
      await expect(page.getByRole('button', { name: 'Show population' })).toBeEnabled()
      await page.getByRole('button', { name: 'Show population' }).click()

      const gradesTableContents = [
        [null, 'TT', 179],
        [null, 'No grade', 10],
        [null, 'HT', 179],
      ]
      await checkGradeTable(page, gradesTableContents)
    })

    test("Course table can show old master's thesis grade scales", async ({ page }) => {
      const coursecode = '50131'
      await searchByCourseCode(page, coursecode)
      await page.getByTestId(`course-${coursecode}`).click()

      await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([coursecode]))

      await expect(page.getByText('Pro gradu -tutkielma tietojenkäsittelytieteessä')).toBeVisible() // 50131

      await expect(page.getByRole('button', { name: 'Show population' })).toBeEnabled()
      await page.getByRole('button', { name: 'Show population' }).click()

      await expect(page.getByText('Pro gradu -tutkielma tietojenkäsittelytieteessä')).toBeVisible()
      await expect(page.getByText('Class of 2007-2020, 10 students')).toBeVisible()
      await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()
      await expect(page.getByText('Showing 10 out of 10 students')).toBeVisible()

      const gradesTableContents = [
        [null, 'NSLA', 1],
        [null, 'L', 3],
        [null, 'ECLA', 5],
        [null, 'CL', 1],
      ]
      await checkGradeTable(page, gradesTableContents)
    })

    test('Shows correct statistics for courses with scale passed-failed', async ({ page }) => {
      const coursecode = '200012'
      await searchByCourseCode(page, coursecode)
      await page.getByTestId(`course-${coursecode}`).click()

      await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([coursecode]))

      await expect(page.getByText('ON-310')).toBeVisible() // Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot
      await expect(page.getByText('200012')).toBeVisible() // Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot

      await expect(page.getByRole('button', { name: 'Show population' })).toBeEnabled()
      await page.getByRole('button', { name: 'Show population' }).click()

      await expect(page.getByText('Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot')).toBeVisible()
      await expect(page.getByText('Class of 2011-2018, 4 students')).toBeVisible()
      await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()
      await expect(page.getByText('Showing 4 out of 4 students')).toBeVisible()

      const gradesTableContents = [
        [null, 'Hyv.', 3],
        [null, 'Hyl.', 1],
      ]
      await checkGradeTable(page, gradesTableContents)
    })
  })

  test.describe('Course mappings work', () => {
    test('Searching single course having substitution mappings shows course statistics', async ({ page }) => {
      const coursecode = 'TKT20001'
      await searchByCourseCode(page, coursecode)
      await page.getByTestId(`course-${coursecode}`).click()

      await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([coursecode]))

      await expect(page.getByText('Tietorakenteet ja algoritmit', { exact: true })).toBeVisible() // The old 10credit variant
      await expect(page.getByText('TKT20001', { exact: true })).toBeVisible()
      await expect(page.getByText('58131')).toBeVisible()

      await openStudentsTab(page)
      await expect(page.locator('svg').filter({ hasText: 'Pass rate' })).toBeVisible()

      await openAttemptsTab(page)
      await expect(page.locator('svg').filter({ hasText: 'Pass rate' })).toBeVisible()

      await clickNewQueryButton(page)
      await expect(page.getByText('Search for courses')).toBeVisible()
    })

    test('Searching multiple courses having substitution mappings shows course statistics', async ({ page }) => {
      await expect(page.getByTestId('select-multiple-courses-toggle')).not.toBeChecked()
      await page.getByTestId('select-multiple-courses-toggle').click()
      await expect(page.getByTestId('select-multiple-courses-toggle')).toBeChecked()

      await searchByCourseCode(page, 'TKT')
      await page.getByTestId(`course-TKT20001`).click()
      await page.getByTestId(`course-TKT10002`).click()

      await expect(page.getByText('Fetch statistics')).toBeEnabled()
      await page.getByText('Fetch statistics').click()

      await expect(page).toHaveURL(
        url => url.searchParams.get('courseCodes') === JSON.stringify(['TKT10002', 'TKT20001'])
      )

      await openSummaryTab(page)
      await page.getByText('Tietorakenteet ja algoritmit').click()
      await expect(page.getByText('TKT10002')).toBeVisible()
      await expect(page.getByText('TKT20001')).toBeVisible()
      await expect(page.getByText('58131')).not.toBeVisible()

      await openSummaryTab(page)
      await page.getByText('Ohjelmoinnin perusteet').click()
      await expect(page.getByText('TKT10002')).toBeVisible()
      await expect(page.getByText('TKT20001')).toBeVisible()
      await expect(page.getByText('Käyttöjärjestelmät')).not.toBeVisible()
      await expect(page.getByText('581325')).not.toBeVisible()
    })
  })

  test('On searches with multiple courses, has correct links on the Course tab', async ({ page }) => {
    await expect(page.getByTestId('select-multiple-courses-toggle')).not.toBeChecked()
    await page.getByTestId('select-multiple-courses-toggle').click()
    await expect(page.getByTestId('select-multiple-courses-toggle')).toBeChecked()

    await searchByCourseCode(page, 'BSCS')
    await page.getByTestId(`course-BSCS1003`).click()
    await page.getByTestId(`course-BSCS1001`).click()

    await expect(page.getByText('Fetch statistics')).toBeEnabled()
    await page.getByText('Fetch statistics').click()

    await expect(page).toHaveURL(
      url => url.searchParams.get('courseCodes') === JSON.stringify(['BSCS1001', 'BSCS1003'])
    )

    await page.getByTestId('course-population-for-2023-2024').click()
    await expect(page.getByRole('heading', { name: 'Introduction to Programming' })).toBeVisible()
    await expect(page.getByText('Class of 2023-2024')).toBeVisible()
    await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()

    await page.goBack()

    await page.getByTestId('CourseSelector').click()
    await page.getByTestId('CourseSelectorOptionBSCS1003').click()

    // Check the link has updated correctly
    await expect(page.getByTestId('course-population-for-2022-2023')).toHaveAttribute('href', /BSCS1003/)
    await expect(page.getByTestId('CourseSelector').getByText('Data Structures and Algorithms')).toBeVisible()

    await page.getByTestId('course-population-for-2022-2023').click()
    await expect(page.getByText('Class of 2022-2023')).toBeVisible()
    await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()
  })

  test('Searching course by name displays right courses', async ({ page }) => {
    await expect(page.getByText('Search for courses')).toBeVisible()
    await searchByCourseName(page, 'tietokantojen perusteet')

    await expect(
      page.getByTestId('course-TKT10004').getByText('Tietokantojen perusteet', { exact: true })
    ).toBeVisible()
    await page.getByTestId('course-TKT10004').click()

    await expect(page.getByText('Search for courses')).not.toBeVisible()

    await expect(page.getByText('TKT10004', { exact: true })).toBeVisible() // Tietokantojen perusteet
    await expect(page.getByText('AYTKT10004')).toBeVisible() // Avoin yo: Tietokantojen perusteet
    await expect(page.getByText('BSCS2001')).toBeVisible() // Introduction to Databases
    await expect(page.getByText('581328', { exact: true })).toBeVisible() // Tietokantojen perusteet
    await expect(page.getByText('A581328')).toBeVisible() //  Avoin yo: Tietokantojen perusteet

    await clickNewQueryButton(page)
    await expect(
      page.getByText('Please enter at least 5 characters for course name or 2 characters for course code.')
    ).toBeVisible()
  })

  test('Searching course by name displays right courses, 10 credit courses', async ({ page }) => {
    await expect(page.getByText('Search for courses')).toBeVisible()
    await searchByCourseName(page, 'tietorakenteet ja algoritmit')

    await expect(page.getByText('Tietorakenteet ja algoritmit', { exact: true })).toBeVisible()
    await page.getByTestId(`course-TKT20001`).click()
    await expect(page.getByText('Search for courses')).not.toBeVisible()

    await expect(page.getByText('TKT20001', { exact: true })).toBeVisible() // Tietorakenteet ja algoritmit
    await expect(page.getByText('AYTKT20001')).toBeVisible() // Avoin yo: Tietorakenteet ja algoritmit
    await expect(page.getByText('BSCS1003')).toBeVisible() // Data Structures and Algorithms
    await expect(page.getByText('58131', { exact: true })).toBeVisible() // Tietorakenteet

    await clickNewQueryButton(page)
    await expect(
      page.getByText('Please enter at least 5 characters for course name or 2 characters for course code.')
    ).toBeVisible()

    await searchByCourseName(page, 'tietorakenteet ja algoritmit')
    await page.getByTestId(`course-TKT20001`).click()

    await expect(page.getByText('Search for courses')).not.toBeVisible()
    await expect(page.getByText('TKT20001', { exact: true })).toBeVisible() // Tietorakenteet ja algoritmit
    await expect(page.getByText('AYTKT20001')).toBeVisible() // Avoin yo: Tietorakenteet ja algoritmit
    await expect(page.getByText('BSCS1003')).toBeVisible() // Data Structures and Algorithms
    await expect(page.getByText('58131', { exact: true })).toBeVisible() // Tietorakenteet
  })

  test('"Select all search results" button is not showing unless "Select multiple courses" toggle is on', async ({
    page,
  }) => {
    await expect(page.getByText('Search for courses')).toBeVisible()
    await searchByCourseCode(page, 'TKT')

    await expect(page.getByTestId('select-multiple-courses-toggle')).not.toBeChecked()
    await expect(page.getByText('Select all search results')).not.toBeVisible()
    await page.getByTestId('select-multiple-courses-toggle').click()
    await expect(page.getByTestId('select-multiple-courses-toggle')).toBeChecked()
    await expect(page.getByTestId('select-multiple-courses-toggle')).toBeChecked()

    await expect(page.getByText('Select all search results')).toBeVisible()
  })

  test('Provider organization select works', async ({ page }) => {
    await expect(page.getByText('Search for courses')).toBeVisible()
    await searchByCourseName(page, 'tietokantojen perusteet')

    await page.getByTestId(`course-TKT10004`).click()
    await expect(page.getByText('Search for courses')).not.toBeVisible()

    await expect(page.getByText('TKT10004', { exact: true })).toBeVisible() // Tietokantojen perusteet
    await expect(page.getByText('AYTKT10004')).toBeVisible() // Avoin yo: Tietokantojen perusteet
    await expect(page.getByText('BSCS2001')).toBeVisible() // Introduction to Databases
    await expect(page.getByText('581328', { exact: true })).toBeVisible() // Tietokantojen perusteet
    await expect(page.getByText('A581328')).toBeVisible() // Avoin yo: Tietokantojen perusteet

    await page.getByTestId('ProviderOrganizationSelect').click()

    await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).toBeVisible()
    await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).toBeVisible()
    await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).toBeVisible()

    await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).not.toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).not.toHaveAttribute('aria-selected', 'true')

    await page.getByTestId('ProviderOrganizationSelectOptionRegular').click()

    await page.getByTestId('ProviderOrganizationSelect').click()
    await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).not.toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).not.toHaveAttribute('aria-selected', 'true')

    await page.getByTestId('ProviderOrganizationSelectOptionOpen').click()

    await page.getByTestId('ProviderOrganizationSelect').click()
    await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).not.toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).not.toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).toHaveAttribute('aria-selected', 'true')
  })

  test.describe('Course populations', () => {
    test('Can find course population', async ({ page }) => {
      await expect(page.getByText('Search for courses')).toBeVisible()
      await searchByCourseCode(page, 'TKT20003')
      await page.getByTestId(`course-TKT20003`).click()

      await expect(page.getByText('TKT20003')).toBeVisible() // Käyttöjärjestelmät
      await expect(page.getByText('582219')).toBeVisible() //  Käyttöjärjestelmät
      await page.getByTestId('course-population-for-2020-2021').click()

      await expect(page.getByText('Käyttöjärjestelmät')).toBeVisible()
      await expect(page.getByText('Class of 2020-2021, 19 students')).toBeVisible()
      await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()

      await expect(page.getByText('TKT20003')).toBeVisible()

      await page.getByText('Students (19)').click()
      await expect(page.getByText('394776')).toBeVisible()
      await expect(page.getByText('416369')).toBeVisible()
    })

    test('Population of course shows grades for each student', async ({ page }) => {
      await searchByCourseCode(page, 'TKT20001')
      await page.getByTestId(`course-TKT20001`).click()
      await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify(['TKT20001']))

      // This step should *not* be needed to make this test work (but it is)
      await expect(page.getByRole('heading', { name: 'Selected course' })).toBeVisible()

      await expect(page.getByText('TKT20001', { exact: true })).toBeVisible() // Tietorakenteet ja algoritmit
      await expect(page.getByText('AYTKT20001')).toBeVisible() // Avoin yo: Tietorakenteet ja algoritmit
      await expect(page.getByText('BSCS1003')).toBeVisible() // Data Structures and Algorithms
      await expect(page.getByText('58131')).toBeVisible() // Tietorakenteet

      await page.getByTestId('course-population-for-2019-2020').click()

      await expect(page.getByText('Tietorakenteet ja algoritmit')).toBeVisible()
      await expect(page.getByText('Class of 2019-2020, 33 students')).toBeVisible()
      await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()

      // Check grade field in Students tab
      await page.getByText('Students (33)').click()
      await expect(
        page.locator('tbody > tr').filter({ hasText: '394776' }).locator('td').nth(3).getByText('3')
      ).toBeVisible()
      await expect(
        page.locator('tbody > tr').filter({ hasText: '497388' }).locator('td').nth(3).getByText('2')
      ).toBeVisible()
    })

    test("In 'Course population' view, student numbers of students that the user isn't allowed to see are hidden", async ({
      page,
    }) => {
      await searchByCourseCode(page, 'TKT20001')
      await page.getByTestId(`course-TKT20001`).click()

      await expect(page.getByText('TKT20001', { exact: true })).toBeVisible() //  Tietorakenteet ja algoritmit
      await expect(page.getByText('AYTKT20001', { exact: true })).toBeVisible() // Avoin yo: Tietorakenteet ja algoritmit
      await expect(page.getByText('BSCS1003')).toBeVisible() // Data Structures and Algorithms
      await expect(page.getByText('58131')).toBeVisible() // Tietorakenteet

      await page.getByTestId('course-population-for-2019-2020').click()

      await expect(page.getByText('Tietorakenteet ja algoritmit')).toBeVisible()
      await expect(page.getByText('Class of 2019-2020, 33 students')).toBeVisible()
      await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()

      await page.getByText('Students (33)').click()
      await expect(page.locator('tbody > tr').filter({ hasText: 'Hidden' })).toHaveCount(9)
    })
  })

  test('Language distribution is correct', async ({ page }) => {
    await searchByCourseCode(page, 'TKT20003')
    await page.getByTestId(`course-TKT20003`).click()
    await expect(page.getByText('TKT20003')).toBeVisible() // Käyttöjärjestelmät
    await expect(page.getByText('582219')).toBeVisible() // Käyttöjärjestelmät

    await page.getByTestId('course-population-for-2021-2022').click()

    await expect(page.getByText('Käyttöjärjestelmät')).toBeVisible()
    await expect(page.getByText('Class of 2021-2022')).toBeVisible()
    await expect(page.getByText('Include substitutions, Open and normal')).toBeVisible()

    // Check count column of Language distribution
    await page.getByText('Language distribution').click()
    await expect(
      page.locator('tbody > tr').filter({ hasText: 'finnish' }).locator('td').nth(1).getByText('5')
    ).toBeVisible()
    await expect(
      page.locator('tbody > tr').filter({ hasText: 'english' }).locator('td').nth(1).getByText('2')
    ).toBeVisible()
  })

  test.describe('Single course stats', () => {
    test.describe('Combine substitutions off', () => {
      test.beforeEach(async ({ page }) => {
        await expect(page).toHaveURL('/coursestatistics')
        await expect(page.getByText('Search for courses')).toBeVisible()

        await page.getByTestId('combine-substitutions-toggle').click()
        await expect(page.getByTestId('combine-substitutions-toggle')).not.toBeChecked()

        await searchByCourseCode(page, 'TKT10002')
        await page.getByTestId(`course-TKT10002`).click()

        await expect(page.getByText('Search for courses')).not.toBeVisible()
        await expect(page.getByText('Ohjelmoinnin perusteet')).toBeVisible() // TKT10002
      })

      test('Time range', async ({ page }) => {
        await page.getByTestId('FromYearSelector').click()
        await expect(page.getByTestId('FromYearSelectorOption2016-2017')).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator('[data-cy^="FromYearSelectorOption"]')).toHaveCount(8)
        await clickAway(page)

        await page.getByTestId('ToYearSelector').click()
        await expect(page.getByTestId('ToYearSelectorOption2023-2024')).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator('[data-cy^="ToYearSelectorOption"]')).toHaveCount(8)
        await clickAway(page)

        await expect(page.getByText('Show population')).toBeEnabled()
      })

      test.describe('Students tab', () => {
        test.describe('Info boxes', () => {
          test('Student statistics table', async ({ page }) => {
            await page.getByTestId('StudentStatistics-info-box-button').hover()
            await expect(
              page.getByTestId('StudentStatistics-info-box-content').getByText('Table - Students')
            ).toBeVisible()
          })

          test('Pass rate', async ({ page }) => {
            await page.getByTestId('PassRateStudents-info-box-button').hover()
            await expect(
              page.getByTestId('PassRateStudents-info-box-content').getByText('Pass rate - Students')
            ).toBeVisible()
          })

          test('Grade distribution', async ({ page }) => {
            await toggleShowGrades(page)
            await page.getByTestId('GradeDistribution-info-box-button').hover()
            await expect(
              page.getByTestId('GradeDistribution-info-box-content').getByText('Grade distribution')
            ).toBeVisible()
          })
        })

        test('Show grades off, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 160, 140, 6, 14, '87.50 %', '12.50 %'],
            ['2023-2024', 7, 1, 0, 6, '14.29 %', '85.71 %'],
            ['2022-2023', 30, 27, 0, 3, '90.00 %', '10.00 %'],
            ['2021-2022', 20, 15, 0, 5, '75.00 %', '25.00 %'],
            ['2020-2021', 23, 23, 0, null, '100.00 %', '0.00 %'],
            ['2019-2020', 28, 28, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 28, 26, 2, null, '92.86 %', '7.14 %'],
            ['2017-2018', 23, 19, 4, null, '82.61 %', '17.39 %'],
            ['2016-2017', 1, 1, 0, null, '100.00 %', '0.00 %'],
          ]
          await checkTableContents(page, tableContents)
        })

        test('Show grades off, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 160, 140, 6, 14, '87.50 %', '12.50 %'],
            ['Syksy 2023', 7, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 9, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 18, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 9, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 11, 6, 0, 5, '54.55 %', '45.45 %'],
            ['Kevät 2021', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 19, 19, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 24, 24, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 20, 18, 2, null, '90.00 %', '10.00 %'],
            ['Kevät 2018', 16, 12, 4, null, '75.00 %', '25.00 %'],
            ['Syksy 2017', 7, 7, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 1, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleSeparateBySemesters(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 160, 6, 3, 8, 5, 24, 99, 1, 14, '87.50 %', '12.50 %'],
            ['2023-2024', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
            ['2022-2023', 30, 0, 0, 0, 0, 6, 21, 0, 3, '90.00 %', '10.00 %'],
            ['2021-2022', 20, 0, 0, 0, 0, 2, 13, 0, 5, '75.00 %', '25.00 %'],
            ['2020-2021', 23, 0, 0, 2, 0, 2, 18, 1, null, '100.00 %', '0.00 %'],
            ['2019-2020', 28, 0, 1, 4, 1, 5, 17, 0, null, '100.00 %', '0.00 %'],
            ['2018-2019', 28, 2, 2, 1, 2, 3, 18, 0, null, '92.86 %', '7.14 %'],
            ['2017-2018', 23, 4, 0, 1, 2, 5, 11, 0, null, '82.61 %', '17.39 %'],
            ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 160, 6, 3, 8, 5, 24, 99, 1, 14, '87.50 %', '12.50 %'],
            ['Syksy 2023', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 9, 0, 0, 0, 0, 3, 6, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 0, 0, 0, 0, 3, 15, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 9, 0, 0, 0, 0, 2, 7, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 11, 0, 0, 0, 0, 0, 6, 0, 5, '54.55 %', '45.45 %'],
            ['Kevät 2021', 4, 0, 0, 0, 0, 0, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 19, 0, 0, 2, 0, 2, 14, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 4, 0, 1, 0, 1, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 24, 0, 0, 4, 0, 5, 15, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 8, 0, 0, 0, 1, 1, 6, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 20, 2, 2, 1, 1, 2, 12, 0, null, '90.00 %', '10.00 %'],
            ['Kevät 2018', 16, 4, 0, 1, 0, 3, 8, 0, null, '75.00 %', '25.00 %'],
            ['Syksy 2017', 7, 0, 0, 0, 2, 2, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
          ]
          // Semesters have to be toggled first as it triggers a content reload and disables grade toggle
          await toggleSeparateBySemesters(page)
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })
      })

      test.describe('Attempts tab', () => {
        test.beforeEach(async ({ page }) => {
          await openAttemptsTab(page)
        })

        test.describe('Info boxes', () => {
          test('Attempt statistics table', async ({ page }) => {
            await page.getByTestId('AttemptStatistics-info-box-button').click()
            await expect(
              page.getByTestId('AttemptStatistics-info-box-content').getByText('Table - Attempts')
            ).toBeVisible()
          })

          test('Pass rate', async ({ page }) => {
            await page.getByTestId('PassRateAttempts-info-box-button').click()
            await expect(
              page.getByTestId('PassRateAttempts-info-box-content').getByText('Pass rate - Attempts')
            ).toBeVisible()
          })

          test('Grade distribution', async ({ page }) => {
            await toggleShowGrades(page)
            await page.getByTestId('GradeDistribution-info-box-button').click()
            await expect(
              page.getByTestId('GradeDistribution-info-box-content').getByText('Grade distribution')
            ).toBeVisible()
          })
        })

        test('Show grades off, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 146, 140, 6, '95.89 %', 73],
            ['2023-2024', 7, 1, 0, '14.29 %', 7],
            ['2022-2023', 43, 27, 0, '62.79 %', 43],
            ['2021-2022', 23, 15, 0, '65.22 %', 23],
            ['2020-2021', 23, 23, 0, '100.00 %', null],
            ['2019-2020', 28, 28, 0, '100.00 %', null],
            ['2018-2019', 28, 26, 2, '92.86 %', null],
            ['2017-2018', 23, 19, 4, '82.61 %', null],
            ['2016-2017', 1, 1, 0, '100.00 %', null],
          ]
          await checkTableContents(page, tableContents)
        })

        test('Show grades off, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 160, 140, 6, 14, '87.50 %', '12.50 %'],
            ['Syksy 2023', 7, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 9, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 18, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 9, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 11, 6, 0, 5, '54.55 %', '45.45 %'],
            ['Kevät 2021', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 19, 19, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 4, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 24, 24, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 20, 18, 2, null, '90.00 %', '10.00 %'],
            ['Kevät 2018', 16, 12, 4, null, '75.00 %', '25.00 %'],
            ['Syksy 2017', 7, 7, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 1, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleSeparateBySemesters(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 146, 6, 3, 8, 5, 24, 99, 1],
            ['2023-2024', 7, 0, 0, 0, 0, 0, 1, 0],
            ['2022-2023', 43, 0, 0, 0, 0, 6, 21, 0],
            ['2021-2022', 23, 0, 0, 0, 0, 2, 13, 0],
            ['2020-2021', 23, 0, 0, 2, 0, 2, 18, 1],
            ['2019-2020', 28, 0, 1, 4, 1, 5, 17, 0],
            ['2018-2019', 28, 2, 2, 1, 2, 3, 18, 0],
            ['2017-2018', 23, 4, 0, 1, 2, 5, 11, 0],
            ['2016-2017', 1, 0, 0, 0, 0, 1, 0, 0],
          ]
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 160, 6, 3, 8, 5, 24, 99, 1, 14, '87.50 %', '12.50 %'],
            ['Syksy 2023', 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
            ['Kevät 2023', 9, 0, 0, 0, 0, 3, 6, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 0, 0, 0, 0, 3, 15, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 9, 0, 0, 0, 0, 2, 7, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 11, 0, 0, 0, 0, 0, 6, 0, 5, '54.55 %', '45.45 %'],
            ['Kevät 2021', 4, 0, 0, 0, 0, 0, 4, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 19, 0, 0, 2, 0, 2, 14, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 4, 0, 1, 0, 1, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 24, 0, 0, 4, 0, 5, 15, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2019', 8, 0, 0, 0, 1, 1, 6, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 20, 2, 2, 1, 1, 2, 12, 0, null, '90.00 %', '10.00 %'],
            ['Kevät 2018', 16, 4, 0, 1, 0, 3, 8, 0, null, '75.00 %', '25.00 %'],
            ['Syksy 2017', 7, 0, 0, 0, 2, 2, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2016', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleSeparateBySemesters(page)
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })
      })
    })

    test.describe('Combine substitutions on', () => {
      test.beforeEach(async ({ page }) => {
        await expect(page).toHaveURL('/coursestatistics')
        await expect(page.getByText('Search for courses')).toBeVisible()
        await searchByCourseCode(page, 'TKT10002')
        await page.getByTestId(`course-TKT10002`).click()

        await expect(page.getByText('Search for courses')).not.toBeVisible()
        await expect(page.getByText('TKT10002', { exact: true })).toBeVisible() // Ohjelmoinnin perusteet
        await expect(page.getByText('AYTKT10002')).toBeVisible() // Avoin yo: Ohjelmoinnin perusteet
        await expect(page.getByText('BSCS1001')).toBeVisible() // Introduction to Programming
        await expect(page.getByText('581325', { exact: true })).toBeVisible() // Ohjelmoinnin perusteet
        await expect(page.getByText('A581325')).toBeVisible() //  Avoin yo: Ohjelmoinnin perusteet
      })

      test('Time range', async ({ page }) => {
        await page.getByTestId('FromYearSelector').click()
        await expect(page.getByTestId('FromYearSelectorOption1999-2000')).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator('[data-cy^="FromYearSelectorOption"]')).toHaveCount(25)
        await clickAway(page)

        await page.getByTestId('ToYearSelector').click()
        await expect(page.getByTestId('ToYearSelectorOption2023-2024')).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator('[data-cy^="ToYearSelectorOption"]')).toHaveCount(25)
        await clickAway(page)

        await expect(page.getByText('Show population')).toBeEnabled()
      })

      test.describe('Students tab', () => {
        test('Show grades off, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 253, 236, 8, 9, '93.28 %', '6.72 %'],
            ['2023-2024', 8, 2, 0, 6, '25.00 %', '75.00 %'],
            ['2022-2023', 31, 28, 0, 3, '90.32 %', '9.68 %'],
            ['2021-2022', 27, 27, 0, 0, '100.00 %', '0.00 %'],
            ['2020-2021', 33, 33, 0, null, '100.00 %', '0.00 %'],
            ['2019-2020', 57, 56, 1, null, '98.25 %', '1.75 %'],
            ['2018-2019', 39, 38, 1, null, '97.44 %', '2.56 %'],
            ['2017-2018', 28, 24, 4, null, '85.71 %', '14.29 %'],
            ['2016-2017', 7, 6, 1, null, '85.71 %', '14.29 %'],
            ['2015-2016', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['2014-2015', 6, 6, 0, null, '100.00 %', '0.00 %'],
            ['2013-2014', 1, 1, 0, null, '100.00 %', '0.00 %'],
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
          await checkTableContents(page, tableContents)
        })

        test('Show grades off, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 254, 236, 9, 9, '92.91 %', '7.09 %'],
            ['Syksy 2023', 8, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 10, 10, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 18, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 11, 11, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 16, 16, 0, 0, '100.00 %', '0.00 %'],
            ['Kevät 2021', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 25, 25, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 26, 26, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 31, 30, 1, null, '96.77 %', '3.23 %'],
            ['Kevät 2019', 16, 16, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 24, 22, 2, null, '91.67 %', '8.33 %'],
            ['Kevät 2018', 20, 16, 4, null, '80.00 %', '20.00 %'],
            ['Syksy 2017', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 3, 1, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 2, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 0, 0, 0, 0, '–', '–'],
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
          await toggleSeparateBySemesters(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 253, 8, 4, 13, 9, 37, 168, 5, 9, '93.28 %', '6.72 %'],
            ['2023-2024', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
            ['2022-2023', 31, 0, 0, 0, 0, 6, 22, 0, 3, '90.32 %', '9.68 %'],
            ['2021-2022', 27, 0, 0, 1, 0, 2, 24, 0, 0, '100.00 %', '0.00 %'],
            ['2020-2021', 33, 0, 0, 2, 1, 2, 27, 1, null, '100.00 %', '0.00 %'],
            ['2019-2020', 57, 1, 1, 5, 3, 9, 38, 0, null, '98.25 %', '1.75 %'],
            ['2018-2019', 39, 1, 3, 2, 2, 6, 25, 0, null, '97.44 %', '2.56 %'],
            ['2017-2018', 28, 4, 0, 1, 2, 6, 15, 0, null, '85.71 %', '14.29 %'],
            ['2016-2017', 7, 1, 0, 0, 1, 1, 4, 0, null, '85.71 %', '14.29 %'],
            ['2015-2016', 3, 0, 0, 1, 0, 0, 1, 1, null, '100.00 %', '0.00 %'],
            ['2014-2015', 6, 0, 0, 1, 0, 0, 2, 3, null, '100.00 %', '0.00 %'],
            ['2013-2014', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
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
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total students, Failed, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 254, 9, 4, 13, 9, 37, 168, 5, 9, '92.91 %', '7.09 %'],
            ['Syksy 2023', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 10, 0, 0, 0, 0, 3, 7, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 0, 0, 0, 0, 3, 15, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 11, 0, 0, 0, 0, 2, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 16, 0, 0, 1, 0, 0, 15, 0, 0, '100.00 %', '0.00 %'],
            ['Kevät 2021', 8, 0, 0, 0, 0, 0, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 25, 0, 0, 2, 1, 2, 19, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 26, 0, 1, 1, 2, 4, 18, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 31, 1, 0, 4, 1, 5, 20, 0, null, '96.77 %', '3.23 %'],
            ['Kevät 2019', 16, 0, 1, 1, 1, 2, 11, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 24, 2, 2, 1, 1, 4, 14, 0, null, '91.67 %', '8.33 %'],
            ['Kevät 2018', 20, 4, 0, 1, 0, 4, 11, 0, null, '80.00 %', '20.00 %'],
            ['Syksy 2017', 8, 0, 0, 0, 2, 2, 4, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 3, 0, 0, 0, 0, 1, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 2, 0, 0, 1, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 0, 0, 0, 0, 0, 0, 3, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 3, 0, 0, 1, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2013', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2012', 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2012', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2011', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2011', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2010', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2010', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2009', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2009', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2008', 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
            ['Kevät 2008', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2007', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2007', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2006', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2006', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2005', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2005', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2004', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2004', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2003', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2003', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2002', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2002', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2001', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2001', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2000', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2000', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 1999', 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleSeparateBySemesters(page)
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })
      })

      test.describe('Attempts tab', () => {
        test.beforeEach(async ({ page }) => {
          await openAttemptsTab(page)
        })

        test('Show grades off, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
            ['Total', 245, 236, 9, '96.33 %', 90],
            ['2023-2024', 8, 2, 0, '25.00 %', 8],
            ['2022-2023', 44, 28, 0, '63.64 %', 44],
            ['2021-2022', 38, 27, 0, '71.05 %', 38],
            ['2020-2021', 33, 33, 0, '100.00 %', null],
            ['2019-2020', 57, 56, 1, '98.25 %', null],
            ['2018-2019', 40, 38, 2, '95.00 %', null],
            ['2017-2018', 28, 24, 4, '85.71 %', null],
            ['2016-2017', 7, 6, 1, '85.71 %', null],
            ['2015-2016', 3, 3, 0, '100.00 %', null],
            ['2014-2015', 6, 6, 0, '100.00 %', null],
            ['2013-2014', 1, 1, 0, '100.00 %', null],
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
          await checkTableContents(page, tableContents)
        })

        test('Show grades off, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 254, 236, 9, 9, '92.91 %', '7.09 %'],
            ['Syksy 2023', 8, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 10, 10, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 18, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 11, 11, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 16, 16, 0, 0, '100.00 %', '0.00 %'],
            ['Kevät 2021', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 25, 25, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 26, 26, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 31, 30, 1, null, '96.77 %', '3.23 %'],
            ['Kevät 2019', 16, 16, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 24, 22, 2, null, '91.67 %', '8.33 %'],
            ['Kevät 2018', 20, 16, 4, null, '80.00 %', '20.00 %'],
            ['Syksy 2017', 8, 8, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 3, 1, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 2, 2, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 3, 3, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 0, 0, 0, 0, '–', '–'],
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
          await toggleSeparateBySemesters(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters off', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
            ['Total', 245, 9, 4, 13, 9, 37, 168, 5],
            ['2023-2024', 8, 0, 0, 0, 0, 0, 2, 0],
            ['2022-2023', 44, 0, 0, 0, 0, 6, 22, 0],
            ['2021-2022', 38, 0, 0, 1, 0, 2, 24, 0],
            ['2020-2021', 33, 0, 0, 2, 1, 2, 27, 1],
            ['2019-2020', 57, 1, 1, 5, 3, 9, 38, 0],
            ['2018-2019', 40, 2, 3, 2, 2, 6, 25, 0],
            ['2017-2018', 28, 4, 0, 1, 2, 6, 15, 0],
            ['2016-2017', 7, 1, 0, 0, 1, 1, 4, 0],
            ['2015-2016', 3, 0, 0, 1, 0, 0, 1, 1],
            ['2014-2015', 6, 0, 0, 1, 0, 0, 2, 3],
            ['2013-2014', 1, 0, 0, 0, 0, 0, 1, 0],
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
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })

        test('Show grades on, Separate by semesters on', async ({ page }) => {
          const tableContents = [
            // [Time, Total attempts, 0, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
            ['Total', 254, 9, 4, 13, 9, 37, 168, 5, 9, '92.91 %', '7.09 %'],
            ['Syksy 2023', 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
            ['Kevät 2023', 10, 0, 0, 0, 0, 3, 7, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2022', 21, 0, 0, 0, 0, 3, 15, 0, 3, '85.71 %', '14.29 %'],
            ['Kevät 2022', 11, 0, 0, 0, 0, 2, 9, 0, 0, '100.00 %', '0.00 %'],
            ['Syksy 2021', 16, 0, 0, 1, 0, 0, 15, 0, 0, '100.00 %', '0.00 %'],
            ['Kevät 2021', 8, 0, 0, 0, 0, 0, 8, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2020', 25, 0, 0, 2, 1, 2, 19, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2020', 26, 0, 1, 1, 2, 4, 18, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2019', 31, 1, 0, 4, 1, 5, 20, 0, null, '96.77 %', '3.23 %'],
            ['Kevät 2019', 16, 0, 1, 1, 1, 2, 11, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2018', 24, 2, 2, 1, 1, 4, 14, 0, null, '91.67 %', '8.33 %'],
            ['Kevät 2018', 20, 4, 0, 1, 0, 4, 11, 0, null, '80.00 %', '20.00 %'],
            ['Syksy 2017', 8, 0, 0, 0, 2, 2, 4, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2017', 4, 1, 0, 0, 1, 0, 2, 0, null, '75.00 %', '25.00 %'],
            ['Syksy 2016', 3, 0, 0, 0, 0, 1, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2016', 2, 0, 0, 1, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2015', 1, 0, 0, 0, 0, 0, 0, 1, null, '100.00 %', '0.00 %'],
            ['Kevät 2015', 3, 0, 0, 0, 0, 0, 0, 3, null, '100.00 %', '0.00 %'],
            ['Syksy 2014', 3, 0, 0, 1, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2014', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2013', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2013', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2012', 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2012', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2011', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2011', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2010', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2010', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2009', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2009', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2008', 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
            ['Kevät 2008', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2007', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2007', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2006', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2006', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2005', 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ['Kevät 2005', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2004', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2004', 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
            ['Syksy 2003', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2003', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2002', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2002', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2001', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2001', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 2000', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Kevät 2000', 0, 0, 0, 0, 0, 0, 0, 0, 0, '–', '–'],
            ['Syksy 1999', 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
          ]
          await toggleSeparateBySemesters(page)
          await toggleShowGrades(page)
          await checkTableContents(page, tableContents)
        })
      })

      test('After changing time range shows correct options', async ({ page }) => {
        await page.getByTestId('FromYearSelector').click()
        await page.getByTestId('FromYearSelectorOption2016-2017').click()
        await expect(page.getByTestId('FromYearSelectorOption2016-2017')).toHaveAttribute('aria-selected', 'true')
        await clickAway(page)

        await page.getByTestId('ToYearSelector').click()
        await page.getByTestId('ToYearSelectorOption2019-2020').click()
        await expect(page.getByTestId('ToYearSelectorOption2019-2020')).toHaveAttribute('aria-selected', 'true')
        await clickAway(page)

        await page.getByTestId('FromYearSelector').click()
        await expect(page.locator('[data-cy^="FromYearSelectorOption"]')).toHaveCount(21)
        await clickAway(page)

        await page.getByTestId('ToYearSelector').click()
        await expect(page.locator('[data-cy^="ToYearSelectorOption"]')).toHaveCount(8)
        await clickAway(page)

        await expect(page.getByText('Show population')).toBeEnabled()
      })
    })

    test('If no data available, provider organization(s) select is disabled', async ({ page }) => {
      await searchByCourseCode(page, 'TKT20014')
      await page.getByText('TKT20014').click()

      await expect(page.getByText('TKT20014')).toBeVisible() //  Kypsyysnäyte LuK
      await expect(page.getByText('50037')).toBeVisible() // Ruotsinkielinen kypsyysnäyte LuK
      await expect(page.getByText('50036')).toBeVisible() // Suomenkielinen kypsyysnäyte LuK

      await page.getByTestId('ProviderOrganizationSelect').click()

      await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
      await expect(page.getByTestId('ProviderOrganizationSelectOptionBoth')).toHaveText('University + Open university')

      await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).not.toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
      await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).toHaveText('University')
      await expect(page.getByTestId('ProviderOrganizationSelectOptionRegular')).not.toHaveText(
        'University (not available)'
      )

      await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).not.toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).toHaveText(
        'Open university (not available)'
      )
      await expect(page.getByTestId('ProviderOrganizationSelectOptionOpen')).not.toHaveText('University')
    })

    test('Has right to see all the students, because course provider is TKT', async ({ page }) => {
      await page.goto('coursestatistics?courseCodes=%5B%22TKT10004%22%5D&separate=false')
      await page.getByTestId('course-population-for-2021-2022').click()
      await expect(page.getByText('Students (28)')).toBeVisible()
    })
  })
})

test.describe('Only course statistics', () => {
  test.beforeEach(async ({ page }) => {
    await init(page, '/coursestatistics', 'onlycoursestatistics')
    await expect(page).toHaveURL('/coursestatistics')
  })

  test('Some features of Course Statistics are hidden for courseStatistics-users without other rights', async ({
    page,
  }) => {
    const coursecode = 'TKT10002'
    await searchByCourseCode(page, coursecode)
    await page.getByTestId(`course-${coursecode}`).click()

    await expect(page).toHaveURL(url => url.searchParams.get('courseCodes') === JSON.stringify([coursecode]))

    await expect(page.getByText('Filter statistics by degree programmes')).not.toBeVisible()
    await expect(page.getByText('Show population')).not.toBeVisible()
    await expect(page.getByText('Faculty statistics')).toBeDisabled()

    await openAttemptsTab(page)
    const emptyYear = (year: string) => [year, 'NA', 'NA', 'NA', 'NA', 'NA']

    const attemptsTableContents = [
      // [Time, Total attempts, Passed, Failed, Pass rate, Enrollments]
      ['Total *', 226, 218, 8, '96.46 %', 82],
      emptyYear('2023-2024'),
      ['2022-2023', 44, 28, 0, '63.64 %', 44],
      ['2021-2022', 38, 27, 0, '71.05 %', 38],
      ['2020-2021', 33, 33, 0, '100.00 %', null],
      ['2019-2020', 57, 56, 1, '98.25 %', null],
      ['2018-2019', 40, 38, 2, '95.00 %', null],
      ['2017-2018', 28, 24, 4, '85.71 %', null],
      ['2016-2017', 7, 6, 1, '85.71 %', null],
      emptyYear('2015-2016'),
      ['2014-2015', 6, 6, 0, '100.00 %', null],
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

    await openAttemptsTab(page)
    await checkTableContents(page, attemptsTableContents)
  })
})
