import { test, expect, Page } from '@playwright/test'
import { checkTableStats, init } from './support/commands'

const getEmptyYears = (isAcademicYear: boolean = false) => {
  const today = new Date()
  const latestYear = isAcademicYear && today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear()
  const years = []
  for (let year = latestYear; year >= 2024; year--) {
    if (isAcademicYear) {
      years.push(`${year} - ${year + 1}`)
    } else {
      years.push(year)
    }
  }
  return years
}

const tagName = `tag-${new Date().getTime()}`
const selectYear = async (page: Page, year: number) => {
  await page.getByLabel('Associated start year (optional)').fill(year.toString())
}

const deleteTag = async (page: Page, tagName: string) => {
  await page.getByTestId(`delete-tag-${tagName}-button`).click()
  await expect(page.getByText('Delete tag', { exact: true })).toBeVisible()
  await expect(page.getByText('Are you sure you want to delete tag')).toBeVisible()
  await page.getByTestId('confirm-delete-tag-button').click()
}

test.describe('Degree programme overview', () => {
  test.describe('Degree programme selector', () => {
    test('Degree programme search filter', async ({ page }) => {
      await init(page, '/study-programme', 'admin')
      await expect(page.getByText('Tietojenkäsittelytieteen kandiohjelma')).toBeVisible()
      await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()

      await page.getByTestId('study-programme-filter').click()
      await page.getByPlaceholder('Type here to filter degree programmes').fill('Tietojenkäsittelytieteen')

      await expect(page.getByText('Tietojenkäsittelytieteen kandiohjelma')).toBeVisible()
      await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).not.toBeVisible()
    })
  })
  test.describe('Basic information tab works for basic user', () => {
    test.beforeEach(async ({ page }) => {
      init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('year-toggle').click() // NOTE: Tests are written for calendar years
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    test('Basic information tab loads', async ({ page }) => {
      await expect(page.getByTestId('students-of-the-study-programme-section')).toBeVisible()
      await expect(page.getByTestId('credits-produced-by-the-study-programme-section')).toBeVisible()
      await expect(page.getByTestId('graduated-and-thesis-writers-of-the-programme-section')).toBeVisible()
      await expect(page.getByTestId('programmes-before-or-after-section')).toBeVisible()
      await expect(page.getByTestId('average-graduation-times-section')).toBeVisible()
    })

    test('Basic information contains correct students', async ({ page }) => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Started studying, Accepted, Graduated, Cancelled, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0]),
        [2023, 8, 8, 26, 2, 0, 0],
        [2022, 25, 26, 47, 0, 1, 3],
        [2021, 29, 32, 48, 1, 0, 2],
        [2020, 26, 27, 12, 0, 1, 3],
        [2019, 28, 34, 1, 0, 0, 1],
        [2018, 40, 45, 0, 0, 0, 1],
        [2017, 41, 47, 0, 0, 0, 0],
      ]
      await checkTableStats(page, tableContents, 'students-of-the-study-programme')
    })

    test('Basic information contains correct credits', async ({ page }) => {
      const years = getEmptyYears()
      const tableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        [2023, 1519, 1519, 0, 0, 0, 0, 0, 222, 0],
        [2022, 3235, 3205, 0, 0, 30, 0, 0, 209, 0],
        [2021, 5133, 5108, 0, 0, 25, 0, 0, 428, 25],
        [2020, 5801, 5796, 0, 0, 5, 0, 0, 94, 10],
        [2019, 5305, 5305, 0, 0, 0, 0, 0, 162, 0],
        [2018, 3442, 3432, 0, 0, 10, 0, 0, 21, 0],
        [2017, 1211, 1211, 0, 0, 0, 0, 0, 189, 0],
      ]
      await checkTableStats(page, tableContents, 'credits-produced-by-the-study-programme')
    })

    test('Basic information contains correct thesis writers and graduates', async ({ page }) => {
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 26, 5],
        [2022, 47, 13],
        [2021, 48, 76],
        [2020, 12, 23],
        [2019, 1, 19],
        [2018, 0, 0],
        [2017, 0, 1],
      ]
      await checkTableStats(page, tableContents, 'graduated-and-graduations-of-the-programme')
    })

    test('Special study rights can be excluded and basic data changes accordingly', async ({ page }) => {
      await page.getByTestId('study-right-toggle').click()
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated, Cancelled]
        ...years.map(year => [year, 0, 0, 0, 0]),
        [2023, 8, 8, 24, 2],
        [2022, 25, 26, 43, 0],
        [2021, 29, 32, 47, 1],
        [2020, 26, 27, 11, 0],
        [2019, 28, 34, 1, 0],
        [2018, 40, 45, 0, 0],
        [2017, 41, 47, 0, 0],
      ]
      await checkTableStats(page, studentTableContents, 'students-of-the-study-programme')
      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2023, 24, 5],
        [2022, 43, 12],
        [2021, 47, 69],
        [2020, 11, 22],
        [2019, 1, 18],
        [2018, 0, 0],
        [2017, 0, 1],
      ]
      await checkTableStats(page, graduatedTableContents, 'graduated-and-graduations-of-the-programme')
    })

    test('Year can be changed to academic year, and data changes accordingly', async ({ page }) => {
      await page.getByTestId('year-toggle').click()
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started studying, Accepted, Graduated, Cancelled, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 4, 1, 0, 0],
        ['2022 - 2023', 25, 26, 35, 1, 0, 0],
        ['2021 - 2022', 29, 32, 58, 1, 1, 5],
        ['2020 - 2021', 26, 27, 30, 0, 0, 3],
        ['2019 - 2020', 28, 34, 7, 0, 1, 1],
        ['2018 - 2019', 40, 45, 0, 0, 0, 1],
        ['2017 - 2018', 41, 47, 0, 0, 0, 0],
      ]
      await checkTableStats(page, studentTableContents, 'students-of-the-study-programme')

      const creditTableContents = [
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 160, 160, 0, 0, 0, 0, 0, 67, 0],
        ['2022 - 2023', 2725, 2720, 0, 0, 5, 0, 0, 337, 0],
        ['2021 - 2022', 4092, 4042, 0, 0, 50, 0, 0, 198, 0],
        ['2020 - 2021', 5420, 5415, 0, 0, 5, 0, 0, 321, 25],
        ['2019 - 2020', 6043, 6043, 0, 0, 0, 0, 0, 101, 10],
        ['2018 - 2019', 4856, 4851, 0, 0, 5, 0, 0, 107, 0],
        ['2017 - 2018', 2350, 2345, 0, 0, 5, 0, 0, 26, 0],
      ]
      await checkTableStats(page, creditTableContents, 'credits-produced-by-the-study-programme')
      // await page.getByTestId('year-toggle').click()
    })

    test('Basic information graphs render', async ({ page }) => {
      const graph = page.getByTestId('students-of-the-study-programme-line-graph-section')
      await expect(graph.getByText('Started studying')).toBeVisible()
      await expect(graph.getByText('Accepted')).toBeVisible()
      await expect(graph.getByText('Graduated')).toBeVisible()
      await expect(graph.getByText('Cancelled')).toBeVisible()
      await expect(graph.getByText('Transferred away')).toBeVisible()
      await expect(graph.getByText('Transferred to')).toBeVisible()

      const creditsBarChart = page.getByTestId('credits-produced-by-the-study-programme-stacked-bar-chart-section')
      await expect(creditsBarChart.getByText('Degree students')).toBeVisible()
      await expect(creditsBarChart.getByText('Transferred')).toBeVisible()
      await expect(creditsBarChart.getByText('5796')).toBeVisible()
      await expect(creditsBarChart.getByText('428')).toBeVisible()

      const thesisBarChart = page.getByTestId('graduated-and-thesis-writers-of-the-programme-bar-chart-section')
      await expect(thesisBarChart.getByText('Graduated students')).toBeVisible()
      await expect(thesisBarChart.getByText('Wrote thesis')).toBeVisible()
      await expect(thesisBarChart.getByText('47')).toBeVisible()
      await expect(thesisBarChart.getByText('76')).toBeVisible()

      await page.getByTestId('graduation-mode-selector').getByTestId('select-median').click()
      await expect(page.getByTestId('unset-median-bar-chart').getByText('47 graduated')).toBeVisible()

      await page.getByTestId('unset-median-bar-chart').getByText('47 graduated').hover()
      await expect(page.locator('.grad-vals').getByText('47 students graduated in year 2022')).toBeVisible()
      await expect(page.getByText('median study time: 6 semesters')).toBeVisible()
      await expect(page.getByText('24 graduated on time')).toBeVisible()
      await expect(page.getByText('12 graduated max year overtime')).toBeVisible()
      await expect(page.getByText('11 graduated over year late')).toBeVisible()

      const programmesBarChart = page.getByTestId('programmes-before-or-after-stacked-bar-chart-section')
      await expect(programmesBarChart.getByText('Tietojenkäsittelytieteen maisteriohjelma')).toBeVisible()
      await expect(programmesBarChart.getByText('Datatieteen maisteriohjelma')).toBeVisible()
      await expect(programmesBarChart.getByText('Matematiikan ja tilastotieteen maisteriohjelma')).toBeVisible()

      const row = page
        .getByTestId('programmes-before-or-after-data-table')
        .locator('tr')
        .filter({ hasText: 'Matematiikan ja tilastotieteen maisteriohjelma' })
      await expect(row.getByText('33')).toBeVisible()
      await expect(row.getByText('20')).toBeVisible()
      await expect(row.getByText('17')).toBeVisible()
    })
  })

  test.describe('Graduation times of master programmes', () => {
    test('are split into three graphs', async ({ page }) => {
      init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matematiikan ja tilastotieteen maisteriohjelma' }).click()
      await page.getByTestId('year-toggle').click() // Tests are written for calendar year

      // await expect(page.getByTestId("unset-breakdown-bar-chart")).toBeVisible()

      await page.getByTestId('graduation-mode-selector').getByTestId('select-average').click()

      // await expect(page.getByTestId("unset-breakdown-section").getByText("Master study right")).toBeVisible()
      const masterChart = page
        .getByTestId('unset-graduation-times-section')
        .filter({ hasText: 'Master study right', hasNotText: 'Bachelor +' })
      await expect(masterChart).toBeVisible()
      await expect(masterChart.getByText('2 graduated')).toBeVisible()

      await masterChart.getByText('2 graduated').hover()
      await expect(page.locator('.grad-vals').getByText('2 students graduated in year 2021')).toBeVisible()
      await expect(page.getByText('average study time: 4.5 semesters')).toBeVisible()
      await expect(page.getByText('1 graduated on time')).toBeVisible()
      await expect(page.getByText('1 graduated max year overtime')).toBeVisible()
      await expect(page.getByText('0 graduated over year late')).toBeVisible()

      const bachelorMasterChart = page
        .getByTestId('unset-graduation-times-section')
        .filter({ hasText: 'Bachelor + master study right' })
      await expect(bachelorMasterChart).toBeVisible()
      await expect(bachelorMasterChart.getByText('11 graduated')).toBeVisible()

      await bachelorMasterChart.getByText('11 graduated').hover()
      await expect(page.locator('.grad-vals').getByText('11 students graduated in year 2023')).toBeVisible()
      await expect(page.getByText('average study time: 11.18 semesters')).toBeVisible()
      await expect(page.getByText('4 graduated on time')).toBeVisible()
      await expect(page.getByText('6 graduated max year overtime')).toBeVisible()
      await expect(page.getByText('1 graduated over year late')).toBeVisible()
    })
  })

  test.describe('Study tracks and class statistics tab works for basic user', () => {
    test.beforeEach(async ({ page }) => {
      // cy.intercept(
      //   'GET',
      //   'api/studyprogrammes/KH50_001/studytrackstats?special_groups=SPECIAL_INCLUDED&combined_programme='
      // ).as('stQuery')
      init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('StudyTracksAndClassStatisticsTab').click()
    })

    test.describe('Info boxes', () => {
      test('Study track overview section', async ({ page }) => {
        await page.getByTestId('study-track-overview-info-box-button').hover()
        await expect(
          page.getByTestId('study-track-overview-info-box-content').getByText('Opiskelijat, joiden')
        ).toBeVisible()
      })

      test('Progress of students section', async ({ page }) => {
        await page.getByTestId('progress-of-students-info-box-button').hover()
        await expect(
          page.getByTestId('progress-of-students-info-box-content').getByText('Kuvaa koulutusohjelmassa')
        ).toBeVisible()
      })

      test('Average graduation times section', async ({ page }) => {
        await page.getByTestId('average-graduation-times-info-box-button').click()
        await expect(
          page.getByTestId('average-graduation-times-info-box-content').getByText('Yksittäinen palkki')
        ).toBeVisible()
      })
    })

    test('All sections are visible', async ({ page }) => {
      await expect(page.getByTestId('study-track-selector-section')).toBeVisible()
      await expect(page.getByTestId('study-track-overview-section')).toBeVisible()
      await expect(page.getByTestId('progress-of-students-section')).toBeVisible()
      await expect(page.getByTestId('average-graduation-times-section')).toBeVisible()
    })

    test('Students of the degree programme are shown correctly', async ({ page }) => {
      const tableContents = [
        // [Year, All, Started studying, Present, Absent, Passive, Graduated, Has recent attainments, Men, Women, Other/Unknown, Finland, Other]
        ['2023 - 2024', 8, 8, 0, 0, 8, 0, 0, 5, 3, 0, 8, 1],
        ['2022 - 2023', 26, 25, 0, 0, 24, 2, 0, 19, 7, 0, 25, 1],
        ['2021 - 2022', 37, 29, 0, 0, 33, 4, 0, 29, 8, 0, 35, 4],
        ['2020 - 2021', 30, 26, 0, 0, 11, 19, 0, 15, 15, 0, 29, 3],
        ['2019 - 2020', 35, 28, 0, 0, 8, 27, 0, 22, 13, 0, 35, 2],
        ['2018 - 2019', 46, 40, 0, 0, 6, 40, 0, 26, 20, 0, 45, 1],
        ['2017 - 2018', 47, 41, 0, 0, 5, 42, 0, 31, 16, 0, 47, 0],
        ['Total', 229, 197, 0, 0, 95, 134, 0, 147, 82, 0, 224, 12],
      ]
      await checkTableStats(page, tableContents, 'study-tracks-and-class-statistics')
    })

    test('Years in the students table can be expanded and study track data will be shown', async ({ page }) => {
      const totalStats: [string, ...Array<number>] = ['2020 - 2021', 30, 26, 0, 0, 11, 19, 0, 15, 15, 0, 29, 3]
      const table = page.getByTestId('study-tracks-and-class-statistics-data-table').locator('tbody')
      const row = table.locator('tr').filter({ hasText: '2020 - 2021' })

      await expect(row.locator('td')).toHaveCount(13)
      await expect(row.locator('td')).toHaveText(totalStats.map(n => n.toString()))

      const studyTrackStats: [string, ...Array<number>][] = [
        ['Ekonometria (MAT-EKO)', 2, 2, 0, 0, 0, 2, 0, 1, 1, 0, 2, 0],
        ['Matematiikka (MAT-MAT)', 13, 10, 0, 0, 1, 12, 0, 7, 6, 0, 12, 3],
        ['Tietojenkäsittelyteoria (MAT-TIE)', 2, 1, 0, 0, 1, 1, 0, 2, 0, 0, 2, 0],
        ['Tilastotiede (MAT-TIL)', 4, 4, 0, 0, 0, 4, 0, 1, 3, 0, 4, 0],
      ]

      await row.getByTestId('show-study-tracks-button').click()

      await Promise.all(
        studyTrackStats.map(async ([studyTrack, ...stats]) => {
          await expect(page.getByText(studyTrack)).toBeVisible()
          const studyTrackRow = table.locator('tr').filter({ hasText: studyTrack })

          await expect(studyTrackRow.locator('td')).toHaveCount(13)
          await expect(studyTrackRow.locator('td')).toHaveText([studyTrack, ...stats].map(n => n.toString()))
        })
      )

      await row.getByTestId('show-study-tracks-button').click()
      await Promise.all(
        studyTrackStats.map(async ([studyTrack]) => {
          await expect(page.getByText(studyTrack)).not.toBeVisible()
        })
      )
    })

    test.describe('Population link button works for', () => {
      test('a single year', async ({ page }) => {
        await page.getByTestId('2023-population-link-button').click()
        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Class of 2023 - 2024, 8 students')).toBeVisible()
      })

      test('total', async ({ page }) => {
        await page.getByTestId('total-population-link-button').click()
        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Class of 2017 - 2026, 227 students')).toBeVisible()
      })

      test('Links to class statistics page with study track info included work', async ({ page }) => {
        const table = page.getByTestId('study-tracks-and-class-statistics-data-table').locator('tbody')
        const row = table.locator('tr').filter({ hasText: '2022 - 2023' })

        await row.getByTestId('show-study-tracks-button').click()
        await table.locator('tr').filter({ hasText: 'Matematiikka (MAT-MAT)' }).getByRole('link').click()

        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Studytrack MAT-MAT')).toBeVisible()
        await expect(page.getByText('Class of 2022 - 2023, 26 students')).toBeVisible()
        await expect(page.getByText('Showing 3 out of 26 students')).toBeVisible()
      })
    })

    test('Student progress data is shown correctly', async ({ page }) => {
      const years = getEmptyYears(true)
      const tableContents = [
        // [Year, All, < 30 credits, 30–60 credits, 60–90 credits, 90–120 credits, 120–150 credits, 150–180 credits, ≥ 180 credits, Graduated]
        ...years.map(year => [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        ['2023 - 2024', 8, 8, 0, 0, 0, 0, 0, 0, 0],
        ['2022 - 2023', 26, 9, 8, 4, 3, 0, 0, 0, 2],
        ['2021 - 2022', 37, 8, 4, 9, 8, 4, 0, 0, 4],
        ['2020 - 2021', 30, 2, 1, 2, 5, 0, 0, 1, 19],
        ['2019 - 2020', 35, 1, 0, 2, 1, 0, 0, 4, 27],
        ['2018 - 2019', 46, 0, 1, 1, 2, 0, 0, 2, 40],
        ['2017 - 2018', 47, 0, 1, 3, 0, 0, 1, 0, 42],
        ['Total', 229, 28, 15, 21, 19, 4, 1, 7, 134],
      ]
      await checkTableStats(page, tableContents, 'study-programme-progress')
    })

    test('Progress section', async ({ page }) => {
      const barChart = page.getByTestId('programme-progress-bar-chart-section')
      await expect(barChart.getByText('Less than 30 credits')).toBeVisible()
      await expect(barChart.getByText('30–60 credits')).toBeVisible()
      await expect(barChart.getByText('At least 180 credits')).toBeVisible()
      await expect(barChart.getByText('58.5%')).toBeVisible() // The percentage for total graduated, to check that the graph renders

      await page.getByTestId('programme-progress-bar-chart-section').getByText('58.5%').hover()
      await expect(page.getByText('Graduated: 134')).toBeVisible()
    })

    test.describe('Average graduation times section', () => {
      test('Shows correct data for all years and one year', async ({ page }) => {
        // NOTE: This test could be flaky. Many nth and first/last used
        await expect(page.getByTestId('unset-graduation-times-section').getByText('2019 - 2020')).toBeVisible()
        await page.getByTestId('unset-graduation-times-section').getByText('21', { exact: true }).hover()
        await expect(page.getByText('On time: 21')).toBeVisible()

        await expect(
          page
            .getByTestId('unset-graduation-times-section')
            .getByText('Click any bar on the chart to open a study track level breakdown for that year')
        ).toBeVisible()
        await page.getByTestId('unset-graduation-times-section').getByText('15', { exact: true }).nth(1).click() // Skip legend
        await expect(
          page
            .getByTestId('unset-graduation-times-section')
            .getByText('Click any bar on the chart to open a study track level breakdown for that year')
        ).not.toBeVisible()

        await expect(page.getByText('Year 2020 - 2021 by start year')).toBeVisible()
        await expect(page.getByText('MAT-MAT')).toBeVisible()

        await page.getByTestId('unsetBreakdownBarChartFaculty').getByText('9', { exact: true }).hover()
        await expect(page.getByText('Matematiikka')).toBeVisible()
        await expect(page.getByText('MAT-MAT').last()).toBeVisible()
        await expect(page.getByText('On time: 9')).toBeVisible()
      })

      test('Shows correct average', async ({ page }) => {
        await page.getByTestId('select-average').click()
        const section = page.getByTestId('average-graduation-times-section')

        await expect(section.getByText('2020 - 2021')).toBeVisible()
        await section.getByText('19 graduated').hover()

        await expect(page.getByText('From class of 2020 - 2021, 19/30 students have graduated')).toBeVisible()
        await expect(page.getByText('average study time: 5.79 semesters')).toBeVisible()
        await expect(page.getByText('15 graduated on time')).toBeVisible()
        await expect(page.getByText('3 graduated max year overtime')).toBeVisible()
        await expect(page.getByText('1 graduated over year late')).toBeVisible()
      })
    })

    test.describe('Study track can be changed', () => {
      test.beforeEach(async ({ page }) => {
        // page.waitForTimeout('@stQuery')
        await expect(page.getByText('All students of the programme')).toBeVisible()
        await page.getByTestId('study-track-select').click()
        await expect(page.getByText('Ekonometria')).toBeVisible()
        await expect(page.getByText('Tietojenkäsittelyteoria')).toBeVisible()
        await expect(page.getByText('Tilastotiede')).toBeVisible()
        await page.getByText('Matematiikka').click()
      })

      test('Students of the study track are shown correctly', async ({ page }) => {
        await expect(
          page
            .getByTestId('study-track-overview-section')
            .getByText('Students of the study track MAT-MAT by starting year')
        ).toBeVisible()
        const tableContents = [
          // [Year, All, Started studying, Present, Absent, Passive, Graduated, Has recent attainment, Men, Women, Other/Unknown, Finland, Other]
          ['2022 - 2023', 3, 3, 0, 0, 1, 2, 0, 2, 1, 0, 3, 0],
          ['2021 - 2022', 4, 1, 0, 0, 1, 3, 0, 3, 1, 0, 4, 0],
          ['2020 - 2021', 13, 10, 0, 0, 1, 12, 0, 7, 6, 0, 12, 3],
          ['2019 - 2020', 17, 14, 0, 0, 0, 17, 0, 10, 7, 0, 17, 1],
          ['2018 - 2019', 24, 21, 0, 0, 2, 22, 0, 11, 13, 0, 24, 0],
          ['2017 - 2018', 28, 24, 0, 0, 1, 27, 0, 15, 13, 0, 28, 0],
          ['Total', 89, 73, 0, 0, 6, 83, 0, 48, 41, 0, 88, 4],
        ]
        await checkTableStats(page, tableContents, 'study-tracks-and-class-statistics')
      })

      test('Links to class statistics page with study track info included work', async ({ page }) => {
        await page.getByTestId('2020-population-link-button').click()
        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Studytrack MAT-MAT')).toBeVisible()
        await expect(page.getByText('Class of 2020 - 2021, 30 students')).toBeVisible()
        await expect(page.getByText('Showing 10 out of 30 students')).toBeVisible()
      })

      // FIXME: This feature was implemented. The data is no-good, so maybe reimplement this when it's clean.
      test.fixme('Info message about missing progress stats is displayed', async ({ page }) => {
        await expect(page.getByText('Progress of students of the study track MAT-MAT by starting year')).toBeVisible()
        await expect(
          page.getByText('Progress data is currently only available for all students of the degree programme.')
        ).toBeVisible()
      })
    })
  })

  test.describe('Programme courses tab works for basic user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('ProgrammeCoursesTab').click()
      await expect(page.getByTestId('by-credit-type-section')).toBeVisible()
      await expect(page.getByTestId('by-credit-type-tab')).toBeVisible()
      await expect(page.getByTestId('by-semester-tab')).toBeVisible()
    })

    test.describe('By credit type tab', () => {
      test.beforeEach(async ({ page }) => {
        await expect(page.getByText('Programme courses by credit type')).toBeVisible()
        await expect(page.getByText('Loading content')).not.toBeVisible()
        await page.getByText('Total students').click()
      })

      test('shows correct data', async ({ page }) => {
        await expect(
          page
            .locator('tbody')
            .locator('tr')
            .filter({ hasText: 'Johdatus yliopistomatematiikkaan', hasNotText: 'Avoin yo' })
            .locator('td')
        ).toHaveText(
          ['Course', 'MAT11001', 'Johdatus yliopistomatematiikkaan', 272, 253, 19, 240, 0, 4, 0, 0, 0, 1, 9].map(n =>
            n.toString()
          )
        )
        await expect(
          page.locator('tbody').locator('tr').filter({ hasText: 'Raja-arvot', hasNotText: 'Avoin yo' }).locator('td')
        ).toHaveText(
          ['Course', 'MAT11003', 'Raja-arvot', 270, 249, 21, 237, 0, 4, 0, 0, 0, 1, 8].map(n => n.toString())
        )
        await expect(
          page
            .locator('tbody')
            .locator('tr')
            .filter({ hasText: 'Differentiaalilaskenta', hasNotText: 'Avoin yo' })
            .locator('td')
        ).toHaveText(
          ['Course', 'MAT11004', 'Differentiaalilaskenta', 262, 248, 14, 230, 0, 4, 0, 0, 0, 1, 14].map(n =>
            n.toString()
          )
        )
      })

      test('year toggle works', async ({ page }) => {
        await page.getByTestId('year-toggle').click()

        await expect(
          page
            .locator('tbody')
            .locator('tr')
            .filter({ hasText: 'Johdatus yliopistomatematiikkaan', hasNotText: 'Avoin yo' })
            .locator('td')
        ).toHaveText(
          ['Course', 'MAT11001', 'Johdatus yliopistomatematiikkaan', 278, 259, 19, 240, 0, 4, 0, 0, 0, 1, 15].map(n =>
            n.toString()
          )
        )
        await expect(
          page.locator('tbody').locator('tr').filter({ hasText: 'Raja-arvot', hasNotText: 'Avoin yo' }).locator('td')
        ).toHaveText(
          ['Course', 'MAT11003', 'Raja-arvot', 274, 253, 21, 237, 0, 4, 0, 0, 0, 1, 12].map(n => n.toString())
        )
        await expect(
          page
            .locator('tbody')
            .locator('tr')
            .filter({ hasText: 'Differentiaalilaskenta', hasNotText: 'Avoin yo' })
            .locator('td')
        ).toHaveText(
          ['Course', 'MAT11004', 'Differentiaalilaskenta', 264, 250, 14, 230, 0, 4, 0, 0, 0, 1, 16].map(n =>
            n.toString()
          )
        )
      })

      test('time range selection works', async ({ page }) => {
        await page.getByTestId('from-year-select').click()
        await page.getByTestId('from-year-select-option-2020').click()
        await page.getByTestId('to-year-select').click()
        await page.getByTestId('to-year-select-option-2021').click()

        await expect(
          page
            .locator('tbody')
            .locator('tr')
            .filter({ hasText: 'Vektorianalyysi I', hasNotText: 'Avoin yo' })
            .filter({ hasNotText: 'Vektorianalyysi II' })
            .locator('td')
        ).toHaveText(
          ['Course', 'MAT21003', 'Vektorianalyysi I', 104, 97, 7, 89, 0, 1, 0, 0, 0, 0, 10].map(n => n.toString())
        )
        await expect(
          page.locator('tbody').locator('tr').filter({ hasText: 'Sarjat', hasNotText: 'Avoin yo' }).locator('td')
        ).toHaveText(['Course', 'MAT21002', 'Sarjat', 83, 77, 6, 70, 0, 1, 0, 0, 0, 0, 7].map(n => n.toString()))
        await expect(
          page.locator('tbody').locator('tr').filter({ hasText: 'Raja-arvot', hasNotText: 'Avoin yo' }).locator('td')
        ).toHaveText(['Course', 'MAT11003', 'Raja-arvot', 80, 73, 7, 69, 0, 2, 0, 0, 0, 1, 1].map(n => n.toString()))
      })

      test("'Show credits/Show students' toggle works", async ({ page }) => {
        const headers = page.getByRole('columnheader')
        await expect(headers).toHaveCount(17)
        await expect(headers).toHaveText([
          'Type',
          'Code',
          'Name',
          'Total students',
          'Breakdown of total',
          'Breakdown of passed',
          'Not included in total or passed',
          'Passed',
          'Not completed',
          'Degree students',
          'Open university students (with hetu)',
          'Open university students (without hetu)',
          'Exchange students',
          'Other university students',
          'Separate studies',
          'Other students',
          'Students with transferred credits',
        ])

        await page.getByTestId('show-credits-students-toggle').click()
        await expect(headers).toHaveCount(13)
        await expect(headers).toHaveText([
          'Type',
          'Code',
          'Name',
          'Total credits',
          'Credits produced by',
          'Transferred credits',
          'Degree students',
          'Open university (hetu)',
          'Open university (no hetu)',
          'Exchange students',
          'Other universities',
          'Separate studies',
          'Other',
        ])
      })
    })

    test.describe('By semester tab', () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId('by-semester-tab').click()
      })

      // TODO: Implement proper tests
      test('can be opened', async ({ page }) => {
        await expect(page.getByText('Programme courses by semester')).toBeVisible()
        await expect(page.getByText('From')).toBeVisible()
        await expect(page.getByText('Until')).toBeVisible()
      })
    })
  })

  test.describe('Degree courses tab works for basic user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('DegreeCoursesTab').click()
    })

    test.describe('Curriculum section', () => {
      test('is shown', async ({ page }) => {
        await expect(page.getByTestId('curriculum-section')).toBeVisible()
        await expect(page.getByText('Select curriculum to edit:')).toBeVisible()
        await expect(page.getByTestId('curriculum-picker').getByText('2023–2026')).toBeVisible()
      })
      test.skip('can be changed', async () => {})
    })

    test.describe('Credit criteria section', () => {
      test('info box', async ({ page }) => {
        await expect(page.getByTestId('credit-criteria-section')).toBeVisible()
        await page.getByTestId('credit-criteria-info-box-button').click()
        await expect(
          page.getByTestId('credit-criteria-info-box-content').getByText('Here you can change')
        ).toBeVisible()
      })

      test.skip('changing the credit criteria works', async ({ page }) => {
        // TODO: Test using the inputs
        // TODO: Button status
        // TODO: Test "previously set to _" text changing when saving
      })
    })

    test('Degree course table', async ({ page }) => {
      await expect(page.getByTestId('degree-course-table')).toBeVisible()
      // TODO: Test clicking the arrow buttons
      // TODO: Test toggling visibility for MODULES and COURSES
      // TODO: Test changing criterion labels
    })
  })

  test.describe('Tags tab works for basic user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('TagsTab').click()
    })

    test('info box', async ({ page }) => {
      await page.getByTestId('create-new-tag-info-box-button').click()
      await expect(page.getByTestId('create-new-tag-info-box-content').getByText('Here you can create')).toBeVisible()
    })

    test.describe('Adding tags to populations and removing them works', () => {
      test.beforeEach(async ({ page }) => {
        await expect(page.getByText('This degree programme does not have any tags yet')).toBeVisible()
        await page.getByTestId('tag-name-text-field').getByRole('textbox').fill(tagName)
      })

      test.afterEach(async ({ page }) => {
        await deleteTag(page, tagName)
        await expect(page.getByText('This degree programme does not have any tags yet')).toBeVisible()
      })

      test('can create and delete tags without start year', async ({ page }) => {
        await page.getByTestId('create-button').click()
        await expect(page.getByText(tagName)).toBeVisible()
        await expect(page.getByText('No associated start year')).toBeVisible()
      })

      test('can create and delete tags with start year', async ({ page }) => {
        await selectYear(page, 2022)
        await page.getByTestId('create-button').click()
        await expect(page.getByText(tagName)).toBeVisible()
        await expect(page.getByText('Associated start year 2022')).toBeVisible()
      })

      test.fixme('population link works', async ({ page }) => {
        await selectYear(page, 2022)
        await page.getByTestId('create-button').click()
        await expect(page.getByText(tagName)).toBeVisible()
        await page.getByTestId('population-link-button').click()
        // FIXME: If no students are tagged with the tag, it shows "Invalid tag id"
        await expect(page.getByText(`Tagged with: ${tagName}`)).toBeVisible()
        await page.goBack()
      })

      test('can create personal tags', async ({ page }) => {
        await page.getByTestId('personal-tag-toggle').click()
        await page.getByTestId('create-button').click()
        await expect(page.getByText(tagName)).toBeVisible()
        await expect(page.getByTestId(`${tagName}-visibility-icon`)).toBeVisible()
      })
    })

    test.describe('Adding tags to students and removing them works', () => {
      const studentInput = '477806,478275;   478953  479239\n   480080'
      const studentNumbers = studentInput.match(/[^\s,;]+/g)!
      test('can add tags to students', async ({ page, context }) => {
        // NOTE: Navigating to each students' page takes time, fix?
        test.slow()

        await page.getByTestId('tag-name-text-field').getByRole('textbox').fill(tagName)
        await selectYear(page, 2022)
        await page.getByTestId('create-button').click()
        await expect(page.getByText(tagName)).toBeVisible()
        await page.getByTestId('add-students-button').click()
        await page.getByTestId('add-students-text-field').getByRole('textbox').fill(studentInput)
        await page.getByTestId('add-students-confirm-button').click()

        await expect(page.getByText('Students added to tag')).toBeVisible()

        await page.getByTestId('population-link-button').click()
        await expect(page.getByText('Matemaattisten tieteiden kandiohjelma')).toBeVisible()
        await expect(page.getByText('Class of 2022 - 2023')).toBeVisible()
        await expect(page.getByText(`Tagged with: ${tagName}`)).toBeVisible()
        await expect(page.getByText('Students (5)')).toBeVisible()

        await page.getByText('Students (5)').click()

        for (const studentNumber of studentNumbers) {
          await expect(page.getByText(studentNumber)).toBeVisible()
        }

        for (const studentNumber of studentNumbers) {
          await page.goto(`/students/${studentNumber}`)
          await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible()
          await expect(page.getByText(tagName)).toBeVisible()
        }

        // Change to other tab
        const pagePromise = context.waitForEvent('page')
        await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
        const newPage = await pagePromise
        await deleteTag(newPage, tagName)
      })

      test('deleting a tag from tag view also removes it from students', async ({ page }) => {
        // NOTE: Navigating to each students' page takes time, fix?
        test.slow()

        await expect(page.getByText(tagName)).not.toBeVisible()
        for (const studentNumber of studentNumbers) {
          await page.goto(`/students/${studentNumber}`)
          await expect(page.getByRole('heading', { name: 'Tags' })).not.toBeVisible()
          await expect(page.getByText(tagName)).not.toBeVisible()
        }
      })
    })
  })

  test.describe('IAM user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/study-programme', 'onlyiamrights')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
    })

    test.skip('year selector', async ({ page }) => {
      // TODO: Implement this test
      // Things to test:
      // - Clicking the button works
      // - Selecting a study track works
      // - The button is disabled if only one year is selected
      // - The slider is not visible if the user does not have correct programme rights
    })

    test('can access programme and correct tabs are visible', async ({ page }) => {
      await expect(page.getByText('Basic information')).toBeVisible()
      await expect(page.getByText('Study tracks and class statistics')).toBeVisible()
      await expect(page.getByText('Update statistics')).not.toBeVisible()
      await expect(page.getByText('Degree courses')).not.toBeVisible()
    })

    test('can access basic information', async ({ page }) => {
      await page.getByTestId('BasicInformationTab').click()
      await expect(page.getByTestId('students-of-the-study-programme-section')).toBeVisible()
      await expect(page.getByTestId('credits-produced-by-the-study-programme-section')).toBeVisible()
      await expect(page.getByTestId('graduated-and-thesis-writers-of-the-programme-section')).toBeVisible()
      await expect(page.getByTestId('average-graduation-times-section')).toBeVisible()
      await expect(page.getByTestId('programmes-before-or-after-section')).toBeVisible()
    })

    test('can access study tracks', async ({ page }) => {
      await page.getByTestId('StudyTracksAndClassStatisticsTab').click()
      await expect(page.getByTestId('study-track-overview-section')).toBeVisible()
      await expect(page.getByTestId('progress-of-students-section')).toBeVisible()
      await expect(page.getByTestId('average-graduation-times-section')).toBeVisible()
    })

    test("doesn't see other tabs", async ({ page }) => {
      await expect(page.getByTestId('DegreeCoursesTab')).not.toBeVisible()
      await expect(page.getByTestId('TagsTab')).not.toBeVisible()
      await expect(page.getByTestId('UpdateStatisticsTab')).not.toBeVisible()
    })
  })
})
