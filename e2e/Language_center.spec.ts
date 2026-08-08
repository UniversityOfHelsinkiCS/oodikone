import { expect, test, Page } from '@playwright/test'
import { init } from './support/commands'

const chooseSemester = async (page: Page, semester: string, fromOrTo: 'from' | 'to') => {
  await page.getByTestId(`semester-${fromOrTo}`).click()
  await page.getByTestId(`select-opt-${semester}`).click()
  await expect(page.getByTestId(`select-opt-${semester}`)).not.toHaveClass(/visible/)
}

const checkNumbers = async (page: Page, numbers: number[], numberOfColumns: number, mode: string) => {
  const totalRow = page.getByTestId(`ooditable-${mode}`).locator('table tbody tr').first()
  const cells = totalRow.locator('td')

  await expect(cells).toHaveCount(numberOfColumns)
  await expect(cells).toHaveText(['Total' + 'All courses total'].concat(numbers.map(number => String(number))))
}

test.describe('When language center is opened', () => {
  test.describe('as an admin user', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/languagecenterview', 'admin')
      await page.getByTestId('completions-button').click()
    })

    test.describe('Faculties tab', () => {
      test.beforeEach(async ({ page }) => {
        await chooseSemester(page, 'Syksy 2017', 'from')
        await chooseSemester(page, 'Kevät 2024', 'to')
      })

      test('Initial view is correct', async ({ page }) => {
        await expect(page.getByText('All courses total')).toBeVisible()
        await expect(
          page.getByRole('cell', { name: 'AYKK-ENG Academic and Professional Communication in English' })
        ).toBeVisible()
        await expect(page.getByText('AYKK-RUKIRJ')).toBeVisible()
      })

      test('Faculties tab shows numbers', async ({ page }) => {
        await checkNumbers(page, [2076, 36, 9, 34, 759, 15, 40, 6, 51, 1, 24, 1059, 42, 0], 15, 'faculties')
      })

      test('Faculties tab "exceeding" button works', async ({ page }) => {
        await page.getByTestId('difference-button').click()
        await checkNumbers(page, [66, 3, 0, 4, 18, 0, 1, 1, 4, 0, 0, 31, 3, 1], 15, 'faculties')
      })

      test('Faculties tab semester selector changes numbers', async ({ page }) => {
        await chooseSemester(page, 'Syksy 2020', 'from')
        await checkNumbers(page, [1184, 28, 6, 28, 499, 4, 10, 2, 36, 0, 9, 535, 27, 0], 15, 'faculties')
      })
    })

    test.describe('Semester tab', () => {
      test.beforeEach(async ({ page }) => {
        await page.getByText('By semesters').click()
        await chooseSemester(page, 'Syksy 2017', 'from')
        await chooseSemester(page, 'Kevät 2024', 'to')
      })

      test('Semester tab shows numbers', async ({ page }) => {
        await checkNumbers(page, [2076, 69, 26, 298, 58, 343, 98, 438, 138, 310, 90, 123, 74, 10, 1], 16, 'semesters')
      })
    })
  })

  test.describe('with a user with no rights', () => {
    test('"Access denied" is shown', async ({ page }) => {
      await init(page, '/languagecenterview', 'norights')

      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
      await expect(page.getByText("You don't currently have permission to view this page.")).toBeVisible()

      await page.getByText('Special populations').click()
      await expect(page.getByText('Language center view')).not.toBeVisible()
    })
  })
})
