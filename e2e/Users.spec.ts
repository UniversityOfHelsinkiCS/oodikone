import { test, expect, Page } from '@playwright/test'
import { init } from './support/commands'

const visibleLinks = {
  norights: ['University', 'Faculties', 'Special populations', 'Feedback'],
  onlycoursestatistics: ['University', 'Courses', 'Special populations', 'Feedback'],
  basic: [] as string[],
  admin: [] as string[],
}

visibleLinks.basic = [...visibleLinks.onlycoursestatistics, 'Faculties', 'Programmes', 'Students']
visibleLinks.admin = [...visibleLinks.basic, 'Teachers', 'Admin']

const containsLinks = async (page: Page, links: string[]) => {
  const navBar = page.getByTestId('nav-bar')
  await Promise.all(links.map(link => expect(navBar.getByText(link)).toBeVisible()))
}

const userButtonWorks = async (page: Page, username: string, mocking = false) => {
  await page.getByTestId('nav-bar-user-button').click()

  await expect(page.getByText(mocking ? `Mocking as ${username}` : `Logged in as ${username}`)).toBeVisible()
  await expect(page.getByText('Language')).toBeVisible()
  await expect(page.getByText('suomi')).toBeVisible()
  await expect(page.getByText('English')).toBeVisible()
  await expect(page.getByText('svenska')).toBeVisible()
  await expect(page.getByText(mocking ? 'Stop mocking' : 'Log out')).toBeVisible()
}

test.describe('Users tests', () => {
  test.describe('Using as user with just grp-oodikone-user, no other rights', () => {
    test('shows correct tabs', async ({ page }) => {
      await init(page, '', 'norights')
      await containsLinks(page, visibleLinks.norights)
      await userButtonWorks(page, 'norights')
    })
  })

  test.describe('Using as coursestatistics user', () => {
    test('shows correct tabs', async ({ page }) => {
      await init(page, '', 'onlycoursestatistics')
      await containsLinks(page, visibleLinks.onlycoursestatistics)
      await userButtonWorks(page, 'onlycoursestatistics')
    })
  })

  test.describe('Using as basic user', () => {
    test('shows correct tabs', async ({ page }) => {
      await init(page, '', 'basic')
      await containsLinks(page, visibleLinks.basic)
      await userButtonWorks(page, 'basic')
    })
  })

  test.describe('Using as admin', () => {
    test.beforeEach(async ({ page }) => {
      await init(page, '/users', 'admin')
    })

    test('should see more stuff than others', async ({ page }) => {
      await containsLinks(page, visibleLinks.admin)
      await userButtonWorks(page, 'admin')
    })

    test.describe('can mock as other users', () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId('user-page-button-basic').click()

        await expect(page.getByText('Basic User')).toBeVisible()
        await expect(page.getByText('IAM Groups')).toBeVisible()
        await expect(page.getByText('Roles')).toBeVisible()
        await expect(page.getByText('Degree programme rights')).toBeVisible()

        await page.getByTestId('mock-button').click()
      })

      test('user button shows mocked user', async ({ page }) => {
        await userButtonWorks(page, 'basic', true)
      })

      test("only the mocked user's programmes are visible", async ({ page }) => {
        await page.route('**/api/populationstatistics/studyprogrammes', async route => {
          const response = await route.fetch()
          expect(response.status()).toBeLessThanOrEqual(304)
          await route.fulfill({ response })
        })

        await init(page, '/populations', 'basic')
        await expect(page.getByRole('heading', { name: 'Degree programme' })).toBeVisible()

        const populationProgrammeSelector = page.getByTestId('population-programme-selector')
        await expect(populationProgrammeSelector.getByPlaceholder('Select degree programme')).toBeVisible()

        const programmeSelectorParent = page.getByTestId('population-programme-selector-parent')
        await programmeSelectorParent.click()
        await expect(programmeSelectorParent).toContainText('Matematiikan ja tilastotieteen maisteriohjelma')
      })
    })
  })
})
