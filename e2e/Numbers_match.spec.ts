import { expect, test, type Page } from '@playwright/test'
import { init } from './support/commands'

type CourseData = [
  courseOrModule: string,
  code: string,
  groupId: string,
  name: string,
  total: number,
  passed: number,
  notCompleted: number,
  failed: number,
  enrolledNoGrade: number,
]

const courseData: CourseData[] = [
  ['Course', 'MAT11001', 'hy-CU-117375151', 'Johdatus yliopistomatematiikkaan', 272, 253, 1 + 18, 1, 18],
  ['Course', 'MAT11003', 'hy-CU-117375413', 'Raja-arvot', 270, 249, 1 + 20, 1, 20],
  ['Course', 'MAT11004', 'hy-CU-117375487', 'Differentiaalilaskenta', 262, 248, 1 + 13, 1, 13],
  ['Course', 'MAT21002', 'hy-CU-117375793', 'Sarjat', 256, 250, 0 + 6, 0, 6],
  ['Course', 'MAT11005', 'hy-CU-117375607', 'Integraalilaskenta', 251, 234, 0 + 17, 0, 17],
  ['Course', 'MAT11002', 'hy-CU-117375394', 'Lineaarialgebra ja matriisilaskenta I', 247, 242, 1 + 4, 1, 4],
  ['Course', 'MAT12003', 'hy-CU-117376940', 'Todennäköisyyslaskenta I', 234, 227, 3 + 4, 3, 4],
  ['Course', 'MAT21001', 'hy-CU-117375754', 'Lineaarialgebra ja matriisilaskenta II', 230, 216, 4 + 10, 4, 10],
  ['Course', 'MAT21003', 'hy-CU-117375829', 'Vektorianalyysi I', 228, 202, 3 + 23, 3, 23],
  ['Course', 'MAT20005', 'hy-CU-120230575', 'Akateemiset taidot', 201, 178, 0 + 23, 0, 23],
  ['Module', 'MAT110', 'hy-SM-117412902', 'Matematiikka, perusopinnot', 195, 195, 0 + 0, 0, 0],
  ['Course', 'MAT21014', 'hy-CU-117377242', 'Johdatus logiikkaan I', 188, 170, 0 + 18, 0, 18],
]

const MAT21003_GROUP_ID = 'hy-CU-117375829'

const yearlyData = [
  [2017, 1, 0, 1, 0, 1 + 0],
  [2018, 31, 27, 4, 0, 4 + 0],
  [2019, 58, 56, 2, 0, 2 + 0],
  [2020, 63, 62, 1, 0, 1 + 0],
  [2021, 41, 35, 0, 6, 0 + 6],
  [2022, 28, 21, 0, 7, 0 + 7],
  [2023, 21, 1, 0, 20, 0 + 20],
] as const

// Copied from services/backend/src/services/studyProgramme/studyProgrammeHelpers.ts (almost)
const getPercentage = (value: any, total: any) => {
  if (typeof value !== 'number' || typeof total !== 'number') return 'NA'
  if (total === 0) return 'NA'
  if (value === 0) return '0.00 %'
  return `${((value / total) * 100).toFixed(2)} %`
}

const selectCourseStatus = async (page: Page, courseGroupId: string, status: string) => {
  await page.getByTestId(`courseFilter-${courseGroupId}-selector`).click()
  await page.getByRole('listbox').getByRole('option', { name: status }).click()
}

const selectYear = async (page: Page, selector: string, option: string) => {
  await page.getByTestId(selector).click()
  await page.getByTestId(option).click()
}

test.describe('Numbers should match between', () => {
  test.slow()
  test.setTimeout(180_000) // 3min

  test.describe('Programme courses, Course statistics and Course population (no substitutions, all years)', () => {
    test('in Programme courses', async ({ page }) => {
      await init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('ProgrammeCoursesTab').click()
      await expect(page.getByText('Programme courses by credit type')).toBeVisible()

      await page.getByRole('columnheader', { name: 'Total students' }).click()

      const rows = page.locator('tbody tr')
      for (const [index, course] of courseData.entries()) {
        const row = rows.nth(index)
        const [courseOrModule, code, , name, total, passed, notCompleted] = course
        // Not optimal, but not checking all locator("td") matches directly with toHaveText is hard.
        for (const [fieldIndex, field] of [courseOrModule, code, name, total, passed, notCompleted].entries()) {
          await expect(row.locator('td').nth(fieldIndex)).toHaveText(String(field))
        }
      }
    })

    test('in Course statistics', async ({ page }) => {
      for (const [
        _courseOrModule,
        _code,
        groupId,
        name,
        total,
        passed,
        _notCompleted,
        failed,
        enrolledNoGrade,
      ] of courseData) {
        await init(page, `/coursestatistics?courses=${groupId}&substitutions=false`, 'basic')
        await expect(page).toHaveURL(
          url =>
            url.pathname === '/coursestatistics' &&
            url.searchParams.get('courses') === groupId &&
            url.searchParams.get('substitutions') === 'false'
        )
        await expect(page.getByText('Course statistics')).toBeVisible()
        await expect(page.getByText(name)).toBeVisible()

        await selectYear(page, 'FromYearSelector', 'FromYearSelectorOption2017-2018')

        const row = page.locator('tbody tr').first()
        await expect(row.locator('td')).toHaveText(
          [
            'Total',
            total,
            passed,
            failed,
            enrolledNoGrade,
            getPercentage(passed, total),
            getPercentage(failed + enrolledNoGrade, total),
          ].map(String)
        )
      }
    })

    test('in Course population', async ({ page }) => {
      for (const [
        _courseOrModule,
        code,
        groupId,
        name,
        total,
        passed,
        _notCompleted,
        failed,
        enrolledNoGrade,
      ] of courseData) {
        await init(
          page,
          `/coursepopulation?from=${2017 - 1949}&to=${2023 - 1949}&courses=${groupId}&substitutions=false`,
          'basic'
        )
        await expect(page).toHaveURL(
          url =>
            url.pathname === '/coursepopulation' &&
            url.searchParams.get('courses') === groupId &&
            url.searchParams.get('substitutions') === 'false'
        )
        await expect(page.getByText(name)).toBeVisible()

        await page.getByTestId('courseFilter-filter-card').click()
        await page.getByTestId('courseFilter-selector').click()
        await page
          .getByTestId('courseFilter-popper')
          .getByRole('option', { name: `${code} - ${name}` })
          .click()

        for (const [status, expected] of [
          ['All', total],
          ['Passed', passed],
          ['Failed', failed],
          ['Enrolled, No Grade', enrolledNoGrade],
        ] as const) {
          await selectCourseStatus(page, groupId, status)
          await expect(page.getByText(`Students (${expected})`)).toBeVisible()
        }
      }
    })
  })

  test.describe('Programme courses, Course statistics and Course population (no substitutions, single years, single course)', () => {
    test('in Programme courses', async ({ page }) => {
      await init(page, '/study-programme')
      await page.getByRole('link', { name: 'Matemaattisten tieteiden kandiohjelma' }).click()
      await page.getByTestId('ProgrammeCoursesTab').click()

      for (const [year, total, passed, _failed, _enrolledNoGrade, notCompleted] of yearlyData) {
        await selectYear(page, 'to-year-select', `to-year-select-option-${year}`)
        await selectYear(page, 'from-year-select', `from-year-select-option-${year}`)

        const row = page.locator('tbody tr').filter({ hasText: 'MAT21003' })
        await expect(row.locator('td').nth(3)).toContainText(String(total))
        await expect(row.locator('td').nth(4)).toContainText(String(passed))
        await expect(row.locator('td').nth(5)).toContainText(String(notCompleted))
      }
    })

    test('in Course statistics', async ({ page }) => {
      for (const [year, total, passed, failed, enrolledNoGrade] of yearlyData) {
        await init(page, `/coursestatistics?courses=${MAT21003_GROUP_ID}&substitutions=false`, 'basic')
        await expect(page).toHaveURL(
          url =>
            url.pathname === '/coursestatistics' &&
            url.searchParams.get('courses') === MAT21003_GROUP_ID &&
            url.searchParams.get('substitutions') === 'false'
        )
        const yearString = `${year}-${year + 1}`

        await selectYear(page, 'ToYearSelector', `ToYearSelectorOption${yearString}`)
        await selectYear(page, 'FromYearSelector', `FromYearSelectorOption${yearString}`)
        await expect(page.getByText('Student statistics')).toBeVisible()
        await expect(page.locator('tbody tr')).toHaveCount(2)

        const row = page.locator('tbody tr').filter({ hasText: 'Total' })

        await expect(row.locator('td')).toHaveText(
          [
            'Total',
            total,
            passed,
            failed,
            enrolledNoGrade,
            getPercentage(passed, total),
            getPercentage(failed + enrolledNoGrade, total),
          ].map(String)
        )
      }
    })

    test('in Course population', async ({ page }) => {
      for (const [year, _total, passed, failed, enrolledNoGrade] of yearlyData) {
        await init(
          page,
          `/coursepopulation?from=${year - 1949}&to=${year - 1949}&courses=${MAT21003_GROUP_ID}&substitutions=false`,
          'basic'
        )
        await expect(page).toHaveURL(
          url =>
            url.pathname === '/coursepopulation' &&
            url.searchParams.get('courses') === MAT21003_GROUP_ID &&
            url.searchParams.get('substitutions') === 'false'
        )
        await expect(page.getByText('Vektorianalyysi I')).toBeVisible()

        await page.getByTestId('courseFilter-filter-card').click()
        await page.getByTestId('courseFilter-selector').click()
        await page
          .getByTestId('courseFilter-popper')
          .getByRole('option', { name: 'MAT21003 - Vektorianalyysi I' })
          .click()

        for (const [status, expected] of [
          ['All', _total],
          ['Passed', passed],
          ['Failed', failed],
          ['Enrolled, No Grade', enrolledNoGrade],
        ] as const) {
          await selectCourseStatus(page, MAT21003_GROUP_ID, status)
          await expect(page.getByText(`Students (${expected})`)).toBeVisible()
        }
      }
    })
  })
})
