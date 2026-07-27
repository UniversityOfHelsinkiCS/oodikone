const { test, expect } = require('@playwright/test')
const studyGuidanceGroupsFixture = require('../cypress/fixtures/studyGuidanceGroups.json')

const userHeaders = {
  admin: {
    uid: 'admin',
    displayname: 'Admin User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users;grp-toska',
    mail: 'grp-toska+mockadminuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-6666666',
  },
  basic: {
    uid: 'basic',
    displayname: 'Basic User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users;grp-oodikone-basic-users',
    mail: 'grp-toska+mockbasicuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-1234567',
  },
  onlystudyguidancegroups: {
    uid: 'onlystudyguidancegroups',
    displayname: 'Study Guidance Groups User',
    'shib-session-id': 'mock-playwright-session',
    hygroupcn: 'grp-oodikone-users',
    mail: 'grp-toska+mockonlystudyguidancegroupsuser@helsinki.fi',
    hypersonsisuid: 'hy-hlo-2222222',
  },
}

const initAs = async (page, path, userId = 'basic') => {
  const headers = userHeaders[userId]
  if (!headers) throw new Error(`${userId} is not valid user id`)

  await page.setExtraHTTPHeaders(headers)
  await page.goto(path)
}

const mockStudyGuidanceGroups = async page => {
  await page.route('**/api/studyguidancegroups', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(studyGuidanceGroupsFixture),
    })
  )
}

test.describe('Study guidance group tests', () => {
  test.describe('Study guidance group overview page', () => {
    test.describe('without study guidance groups', () => {
      test('shows the correct notification', async ({ page }) => {
        await initAs(page, '/studyguidancegroups', 'admin')
        await expect(page.getByText('Study guidance groups')).toBeVisible()
        await expect(page.getByText('You do not have access to any study guidance groups.')).toBeVisible()
      })
    })

    test.describe('without correct rights', () => {
      test('shows the correct notification', async ({ page }) => {
        await initAs(page, '/studyguidancegroups')
        await expect(page.getByText('Access denied')).toBeVisible()
        await expect(
          page.getByText(
            "You don't currently have permission to view this page. If you believe this is a mistake, please contact oodikone@helsinki.fi."
          )
        ).toBeVisible()
      })
    })

    test.describe('with study guidance groups', () => {
      test.beforeEach(async ({ page }) => {
        await mockStudyGuidanceGroups(page)
        await initAs(page, '/studyguidancegroups', 'onlystudyguidancegroups')
      })

      test('shows the correct data', async ({ page }) => {
        await expect(page.getByText('Study guidance groups')).toBeVisible()

        const studyGuidanceGroupsTableContent = [
          ['MAT kandit 2020', '3', 'Matemaattisten tieteiden kandiohjelma', '2020 - 2021'],
          ['Oma ohjausryhmä', '2', 'Add degree programme', 'Add starting year'],
        ]

        for (const row of studyGuidanceGroupsTableContent) {
          const tableRow = page.locator('[data-cy="study-guidance-group-overview-data-table"] tbody tr').filter({
            hasText: row[0],
          })
          await expect(tableRow).toHaveCount(1)
          for (const value of row) {
            await expect(tableRow.getByText(value)).toBeVisible()
          }
        }
      })

      test('has working links to single study guidance groups', async ({ page }) => {
        await page.locator('[data-cy="study-guidance-group-link-sgg-cypress-1"]').click()
        await expect(page).toHaveURL(/\/studyguidancegroups\/sgg-cypress-1$/)
      })
    })
  })

  test.describe('Page for single study guidance group', () => {
    test.beforeEach(async ({ page }) => {
      await mockStudyGuidanceGroups(page)
    })

    test('has a working back button', async ({ page }) => {
      await initAs(page, '/studyguidancegroups/sgg-cypress-1', 'onlystudyguidancegroups')
      await page.getByRole('button', { name: 'Back to groups' }).click()
      await expect(page).toHaveURL(/\/studyguidancegroups$/)
    })

    test.describe('without associated degree programme and year', () => {
      test.beforeEach(async ({ page }) => {
        await initAs(page, '/studyguidancegroups/sgg-cypress-2', 'onlystudyguidancegroups')
      })

      test('shows the correct panes', async ({ page }) => {
        await expect(page.getByText('Oma ohjausryhmä')).toBeVisible()
        await expect(page.locator('[data-cy="Credit accumulation (for 2 students)"]')).toBeVisible()
        await expect(page.locator('[data-cy="Age distribution"]')).toBeVisible()
        await expect(page.locator('[data-cy="Courses of population"]')).toBeVisible()
        await expect(page.getByText('Students (2)')).toBeVisible()
        await expect(page.locator('[data-cy="Credit statistics"]')).toHaveCount(0)
      })

      test.skip('students table has the correct tabs')
      test.skip('general tab of the students table has the correct columns')
    })

    test.describe('with associated degree programme and year', () => {
      test.beforeEach(async ({ page }) => {
        await initAs(page, '/studyguidancegroups/sgg-cypress-1', 'onlystudyguidancegroups')
      })

      test('shows the correct labels', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 4, name: 'MAT kandit 2020' })).toBeVisible()
        await expect(page.locator('.MuiChip-root').first()).toContainText('Matemaattisten tieteiden kandiohjelma')
        await expect(page.locator('.MuiChip-root').last()).toContainText('2020 - 2021')
      })

      test('shows the correct panes', async ({ page }) => {
        await expect(page.locator('[data-cy="Credit accumulation (for 3 students)"]')).toBeVisible()
        await expect(page.locator('[data-cy="Credit statistics"]')).toBeVisible()
        await expect(page.locator('[data-cy="Age distribution"]')).toBeVisible()
        await expect(page.locator('[data-cy="Courses of population"]')).toBeVisible()
        await expect(page.getByText('Students (3)')).toBeVisible()
      })

      test("clicking the 'Show credits starting from the associated academic year' filter", async ({ page }) => {
        await expect(page.locator('[data-cy="ParticipationDate-filter-card"][data-active="false"]')).toBeVisible()
        await page.locator('[data-cy="Credit accumulation (for 3 students)"]').click()
        await page.getByText('Show credits starting from the associated academic year').click()
        await expect(page.locator('[data-cy="ParticipationDate-filter-card"][data-active="true"]')).toBeVisible()
        await expect(page.locator('.date-picker').first().locator('input')).toHaveValue('01.08.2020')
        await expect(page.getByText('Reset All Filters')).toBeVisible()
        await page.getByText('Show credits starting from the associated academic year').click()
        await expect(page.locator('[data-cy="ParticipationDate-filter-card"][data-active="false"]')).toBeVisible()
      })

      test.skip('students table has the correct tabs')
      test.skip('general tab of the students table has the correct columns')
    })
  })
})
