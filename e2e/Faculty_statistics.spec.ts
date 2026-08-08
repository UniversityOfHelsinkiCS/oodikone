import { expect, Page, test } from '@playwright/test'
import { init } from './support/commands'

const facultyName = 'Matemaattis-luonnontieteellinen tiedekunta'

test.use({ acceptDownloads: true })

const openFaculty = async (page: Page, userId?: 'admin' | 'basic') => {
  await init(page, '/faculties', userId)
  await page.getByRole('link', { name: facultyName }).click()
}

test.describe('Faculty statistics', () => {
  test.describe('Faculty list', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/faculties')
    })

    test('contains faculty names and faculty codes', async ({ page }) => {
      const faculties = [
        ['Teologinen tiedekunta', 'H10'],
        ['Oikeustieteellinen tiedekunta', 'H20'],
        ['Lääketieteellinen tiedekunta', 'H30'],
        ['Humanistinen tiedekunta', 'H40'],
        ['Matemaattis-luonnontieteellinen tiedekunta', 'H50'],
        ['Farmasian tiedekunta', 'H55'],
        ['Bio- ja ympäristötieteellinen tiedekunta', 'H57'],
        ['Kasvatustieteellinen tiedekunta', 'H60'],
        ['Valtiotieteellinen tiedekunta', 'H70'],
        ['Svenska social- och kommunalhögskolan', 'H74'],
        ['Maatalous-metsätieteellinen tiedekunta', 'H80'],
        ['Eläinlääketieteellinen tiedekunta', 'H90'],
      ]

      await expect(page.getByRole('heading', { name: 'Faculties', exact: true })).toBeVisible()
      for (const [name, code] of faculties) {
        await expect(page.getByText(name, { exact: true })).toBeVisible()
        await expect(page.getByText(code, { exact: true })).toBeVisible()
      }
    })

    test('contains a working link to faculty page', async ({ page }) => {
      await page.getByRole('link', { name: 'Teologinen tiedekunta' }).click()
      await expect(page).toHaveURL('/faculties/hy-org-1000000580')
      await expect(page.getByText('Teologinen tiedekunta', { exact: true })).toBeVisible()
      await expect(page.getByText('H10', { exact: true })).toBeVisible()
    })
  })

  test.describe('Basic information tab', () => {
    test('shows the correct tabs for an admin user', async ({ page }) => {
      await openFaculty(page, 'admin')
      const tabs = page.getByTestId('faculty-tabs')
      await expect(tabs).toContainText('Basic information')
      await expect(tabs).toContainText('Students by starting year')
      await expect(tabs).toContainText('Graduation times')
      await expect(tabs).toContainText('Update statistics')
    })

    test.describe('Basic user', () => {
      test.beforeEach(async ({ page }) => {
        await openFaculty(page)
      })

      test('info boxes contain the correct information', async ({ page }) => {
        const infoBoxes = [
          ['students-of-the-faculty-info-box-button', 'students-of-the-faculty-info-box-content', 'Taulukon luvut on'],
          [
            'graduated-of-the-faculty-info-box-button',
            'graduated-of-the-faculty-info-box-content',
            'Sisältää kyseisenä',
          ],
          [
            'thesis-writers-of-the-faculty-info-box-button',
            'thesis-writers-of-the-faculty-info-box-content',
            'Sisältää kyseisenä',
          ],
          [
            'credits-produced-by-the-faculty-info-box-button',
            'credits-produced-by-the-faculty-info-box-content',
            'Sisältää opintopisteet',
          ],
        ]

        for (const [button, content, text] of infoBoxes) {
          await page.getByTestId(button).click()
          await expect(page.getByTestId(content)).toContainText(text)
        }
      })

      test('shows all graphs and tables', async ({ page }) => {
        const sections = [
          'students-of-the-faculty-line-graph-section',
          'students-of-the-faculty-interactive-data-table',
          'graduated-of-the-faculty-line-graph-section',
          'graduated-of-the-faculty-interactive-data-table',
          'thesis-writers-of-the-faculty-line-graph-section',
          'thesis-writers-of-the-faculty-interactive-data-table',
          'credits-produced-by-the-faculty-stacked-bar-chart-section',
          'credits-produced-by-the-faculty-interactive-data-table',
        ]

        for (const section of sections) await expect(page.getByTestId(section)).toBeVisible()
      })

      test('shows the correct tabs', async ({ page }) => {
        const tabs = page.getByTestId('faculty-tabs')
        await expect(tabs).toContainText('Basic information')
        await expect(tabs).toContainText('Students by starting year')
        await expect(tabs).toContainText('Graduation times')
        await expect(tabs).not.toContainText('Update statistics')
      })

      test('year toggle works', async ({ page }) => {
        const tables = [
          'credits-produced-by-the-faculty-interactive-data-table',
          'thesis-writers-of-the-faculty-interactive-data-table',
          'students-of-the-faculty-interactive-data-table',
          'graduated-of-the-faculty-interactive-data-table',
        ]
        for (const table of tables) await expect(page.getByTestId(table)).toContainText('2022 - 2023')

        await page.getByTestId('year-toggle').click()
        for (const table of tables) await expect(page.getByTestId(table)).toContainText('2022')
      })

      test('programme toggle works', async ({ page }) => {
        await expect(page.getByTestId('faculty-programmes-shown-info')).not.toBeVisible()
        await page.getByTestId('programme-toggle').click()
        await expect(page.getByTestId('faculty-programmes-shown-info')).toBeVisible()
      })

      test('study rights toggle works', async ({ page }) => {
        await expect(page.getByTestId('faculty-exclude-specials-info')).not.toBeVisible()
        await page.getByTestId('study-right-toggle').click()
        await expect(page.getByTestId('faculty-exclude-specials-info')).toBeVisible()
      })
    })
  })

  test.describe('Students by starting year tab', () => {
    test.beforeEach(async ({ page }) => {
      await openFaculty(page)
      await page.getByText('Students by starting year', { exact: true }).click()
    })

    test.skip('export button downloads an Excel file', async ({ page }) => {
      // Firefox does not trigger playwright's download event when downloading a file
      const downloadPromise = page.waitForEvent('download')
      await page.getByTestId('faculty-student-table-export-button').click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/^oodikone_H50_programme_stats_\d{4}-\d{2}-\d{2}\.xlsx$/)
    })

    test('export button exists and works', async ({ page }) => {
      const exportButton = page.getByTestId('faculty-student-table-export-button')
      await expect(exportButton).toBeVisible()
      await expect(exportButton).toBeEnabled()
      await exportButton.click()
    })

    test('info box contains the correct information', async ({ page }) => {
      await page.getByTestId('faculty-student-table-info-box-button').click()
      await expect(page.getByTestId('faculty-student-table-info-box-content')).toContainText('Opiskelijat, joiden')
    })

    test('percentage toggle works', async ({ page }) => {
      const table = page.getByTestId('faculty-student-stats-table')
      await expect(table).toBeVisible()
      await expect(table).not.toContainText('92.3 %')
      await page.getByTestId('percentage-toggle').click()
      await expect(table).toContainText('92.3 %')
    })
  })

  test.describe('Graduation times tab', () => {
    test.beforeEach(async ({ page }) => {
      await openFaculty(page)
      await page.getByText('Graduation times', { exact: true }).click()
    })

    test('info box contains the correct information', async ({ page }) => {
      await page.getByTestId('average-graduation-times-info-box-button').click()
      await expect(page.getByTestId('average-graduation-times-info-box-content')).toContainText(
        'Opiskelijoiden keskimääräiset'
      )
    })

    test('graphs are visible', async ({ page }) => {
      await expect(page.getByTestId('bachelor-graduation-times-section')).toBeVisible()
      await expect(page.getByTestId('master-graduation-times-section')).toBeVisible()
      await expect(page.getByTestId('doctor-graduation-times-section')).toBeVisible()
    })
  })
})
