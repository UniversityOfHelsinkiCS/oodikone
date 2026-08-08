import { expect, test } from '@playwright/test'
import { init } from './support/commands'

const progressLevels = ['bachelors', 'bachelor-masters', 'masters', 'doctoral']
const graduationTimesLevels = ['bachelor', 'bcMsCombo', 'master', 'doctor']

const checkProgressBarCharts = async (page: Parameters<typeof init>[0]) => {
  for (const level of progressLevels) {
    await expect(page.getByTestId(`faculty-${level}-progress-bar-chart-section`)).toBeVisible({ timeout: 60_000 })
  }
}

const checkProgressTables = async (page: Parameters<typeof init>[0]) => {
  for (const level of progressLevels) {
    await expect(page.getByTestId(`${level}-faculty-progress-table`)).toBeVisible()
  }
}

const checkGraduationCharts = async (page: Parameters<typeof init>[0], mode: string) => {
  for (const level of graduationTimesLevels) {
    const chart = page.getByTestId(`${level}-${mode}-bar-chart`)
    await expect(chart).toBeVisible()
    await expect(chart.getByText('Loading content')).not.toBeVisible()
  }
}

test.describe('University view', () => {
  test.slow()

  test.beforeEach(async ({ page }) => {
    await init(page, '/university')
    await expect(page.getByRole('heading', { name: 'University', exact: true })).toBeVisible()
  })

  test.describe('Faculty progress tab', () => {
    test('contains all the correct progress bar charts', async ({ page }) => {
      await checkProgressBarCharts(page)
    })

    test('contains all the correct progress tables', async ({ page }) => {
      await checkProgressTables(page)
    })

    test("'All study rights / Special study rights excluded' toggle works", async ({ page }) => {
      await page.getByTestId('study-right-toggle').click()
      await checkProgressBarCharts(page)
      await checkProgressTables(page)
    })

    test('info boxes contain correct information', async ({ page }) => {
      await page.getByTestId('faculty-progress-info-box-button').click()
      await expect(page.getByTestId('faculty-progress-info-box-content')).toContainText('Kuvaa tiedekuntaan kuuluvien')

      await page.getByTestId('faculty-bachelor-masters-progress-info-box-button').click()
      await expect(page.getByTestId('faculty-bachelor-masters-progress-info-box-content')).toContainText(
        'The starting year is the'
      )
    })
  })

  test.describe('Faculty graduations tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('faculty-graduations-tab').click()
    })

    test.describe('Different modes work', () => {
      test('Breakdown', async ({ page }) => {
        await page.getByTestId('graduation-mode-selector').getByTestId('select-breakdown').click()
        await checkGraduationCharts(page, 'breakdown')
      })

      test('Median', async ({ page }) => {
        await page.getByTestId('graduation-mode-selector').getByTestId('select-median').click()
        await checkGraduationCharts(page, 'median')
      })

      test('Average', async ({ page }) => {
        await page.getByTestId('graduation-mode-selector').getByTestId('select-average').click()
        await checkGraduationCharts(page, 'average')
      })
    })

    test('info boxes contain correct information', async ({ page }) => {
      await page.getByTestId('average-graduation-times-info-box-button').hover()
      await expect(page.getByTestId('average-graduation-times-info-box-content')).toContainText(
        'Opiskelijoiden keskimääräiset valmistumisajat'
      )
    })
  })
})
