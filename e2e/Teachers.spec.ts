import { test, expect } from '@playwright/test'
import { init } from './support/commands'

test.describe('Teachers page tests', () => {
  test.beforeEach(async ({ page }) => {
    // login as admin = has teacher rights
    await init(page, '/teachers', 'admin')
    expect(page.url()).toContain('/teachers')
  })

  const teacher1 = 'Luokkanen Liisa Viljami'
  const teacher2 = 'Perälä Juhani Susanna'

  test('Check Statistics', async ({ page }) => {
    await page.getByTestId('semester-start').click()
    await page.getByText('Syksy 2020').click()

    await page.getByTestId('course-providers').click()
    await page.getByText('Matemaattisten tieteiden kandiohjelma').click()

    await page.keyboard.press('Escape')

    await page.getByTestId('search-statistics').click()
    await expect(page.getByRole('columnheader')).toHaveCount(4)
    await expect(page.getByText('Export to Excel')).toBeVisible()

    const teacher1Row = page.locator('tr').filter({ hasText: teacher1 })
    await expect(teacher1Row.getByText(teacher1)).toBeVisible()
    await expect(teacher1Row.getByText('235')).toBeVisible()
    await expect(teacher1Row.getByText('97.40%')).toBeVisible()

    const teacher2Row = page.locator('tr').filter({ hasText: teacher2 })
    await expect(teacher2Row.getByText(teacher2)).toBeVisible()
    await expect(teacher2Row.getByText('395')).toBeVisible()
    await expect(teacher2Row.getByText('98.78%')).toBeVisible()
  })

  test('Teacher search works', async ({ page }) => {
    await page.getByTestId('Search').click()
    await page
      .getByTestId('teacher-search')
      .getByPlaceholder('Search by entering a name or an id')
      .fill(teacher1.split(' ')[0])
    await expect(page.getByText(teacher1)).toBeVisible()
    await expect(page.locator('tbody').locator('tr')).toHaveCount(4)
  })

  test('Can check teacher page', async ({ page, context }) => {
    await page.getByTestId('Search').click()
    await page.getByTestId('teacher-search').getByPlaceholder('Search by entering a name or an id').fill(teacher2)

    await expect(page.getByText(teacher2)).toBeVisible()
    expect(await page.getByText(teacher2).getAttribute('href')).toBe('/teachers/hy-hlo-49026530')

    // Change to other tab
    const pagePromise = context.waitForEvent('page')
    await page.getByText(teacher2).click()
    const newPage = await pagePromise

    await newPage.waitForURL('**/teachers/hy-hlo-49026530')
    await expect(newPage.getByRole('heading', { name: teacher2 })).toBeVisible()
    await newPage.getByText('Syksy 2023').click()
    await newPage.getByText('Kevät 2019').click()

    await expect(newPage.getByText('MAT12004')).toBeVisible()
    await expect(newPage.getByText('MAT22002')).toBeVisible()
    await expect(newPage.getByText('MAT22003')).toBeVisible()

    const courseRow = newPage.locator('tr').getByText('MAT12004')
    const rowContent = ['MAT12004', 'Tilastollinen päättely I', '120', '0', '92.31%']
    rowContent.map(content => expect(courseRow.getByText(content)))
  })

  test('Check leaderboad works', async ({ page }) => {
    await page.getByTestId('Leaderboard').click()
    await page.getByTestId('academic-year').click()
    await page.getByText('2020-2021').click()

    await expect(page.getByRole('columnheader')).toHaveCount(4)
    await expect(page.getByText('Export to Excel')).toBeVisible()
    await expect(page.getByText(teacher1)).toBeVisible()
  })
})
