import { expect, Page, test } from '@playwright/test'
import { init, type UserId } from './support/commands'

const studyGuidanceGroups = [
  {
    id: 'sgg-cypress-1',
    name: { fi: 'MAT kandit 2020' },
    members: [{ personStudentNumber: '433237' }, { personStudentNumber: '457144' }, { personStudentNumber: '458090' }],
    tags: { studyProgramme: 'KH50_001', year: '2020' },
  },
  {
    id: 'sgg-cypress-2',
    name: { fi: 'Oma ohjausryhmä' },
    members: [{ personStudentNumber: '474270' }, { personStudentNumber: '479440' }],
    tags: { studyProgramme: null, year: null },
  },
]

const initWithGroups = async (page: Page, path: string, userId: UserId = 'onlystudyguidancegroups') => {
  await init(page, path, userId)
  await page.route('**/api/studyguidancegroups', async route => await route.fulfill({ json: studyGuidanceGroups }))
  await page.reload()
}

test.describe('Study guidance group tests', () => {
  test.describe('Study guidance group overview page', () => {
    test('without study guidance groups shows the correct notification', async ({ page }) => {
      await init(page, '/studyguidancegroups', 'admin')
      await expect(page.getByRole('heading', { name: 'Study guidance groups' })).toBeVisible()
      await expect(page.getByText('You do not have access to any study guidance groups.')).toBeVisible()
    })

    test('without correct rights shows the correct notification', async ({ page }) => {
      await init(page, '/studyguidancegroups', 'basic')
      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
      await expect(
        page.getByText(
          "You don't currently have permission to view this page. If you believe this is a mistake, please contact oodikone@helsinki.fi."
        )
      ).toBeVisible()
    })

    test.describe('with study guidance groups', () => {
      test.beforeEach(async ({ page }) => {
        await initWithGroups(page, '/studyguidancegroups')
        await expect(page.getByRole('heading', { name: 'Study guidance groups' })).toBeVisible()
        await expect(page.getByText('You do not have access to any study guidance groups')).not.toBeVisible()
      })

      test('shows the correct data', async ({ page }) => {
        const row = page.getByTestId('study-guidance-group-overview-data-table').locator('tr')

        // NOTE: Only MAT kandit 2020 can be edited
        await expect(row.filter({ hasText: 'MAT kandit 2020' }).locator('td')).toHaveText([
          'MAT kandit 2020',
          '3',
          'Matemaattisten tieteiden kandiohjelma' + 'Edit',
          '2020 - 2021' + 'Edit',
        ])
        await expect(row.filter({ hasText: 'Oma ohjausryhmä' }).locator('td')).toHaveText([
          'Oma ohjausryhmä',
          '2',
          'Add degree programme',
          'Add starting year',
        ])
      })

      test('has working links to single study guidance groups', async ({ page }) => {
        await page.getByTestId('study-guidance-group-link-sgg-cypress-1').click()
        await expect(page).toHaveURL('/studyguidancegroups/sgg-cypress-1')
      })
    })
  })

  test.describe('Page for single study guidance group', () => {
    test.describe('without associated degree programme and year', () => {
      test.beforeEach(async ({ page }) => {
        await initWithGroups(page, '/studyguidancegroups/sgg-cypress-2')
      })

      test('shows the correct panes', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Oma ohjausryhmä' })).toBeVisible()
        await expect(page.getByTestId('Credit accumulation (for 2 students)')).toBeVisible()
        await expect(page.getByTestId('Age distribution')).toBeVisible()
        await expect(page.getByTestId('Courses of population')).toBeVisible()
        await expect(page.getByText('Students (2)')).toBeVisible()
        await expect(page.getByTestId('Credit statistics')).not.toBeVisible()
      })

      test('students table has the correct tabs', async ({ page }) => {
        await page.getByText('Students (2)').click()
        await expect(page.getByTestId('student-table-tabs').getByRole('tab', { name: 'General' })).toBeVisible()
      })

      test('general tab of the students table has the correct columns', async ({ page }) => {
        const columns = [
          'Student number',
          'Credits',
          'Start date',
          'Degree programmes',
          'TVEX',
          'Tags',
          'Total',
          'Since 1.1.1970',
          'University',
        ]
        await page.getByText('Students (2)').click()
        await expect(page.getByTestId('ooditable-general').locator('table thead th')).toHaveText(columns)
      })
    })

    test.describe('with associated degree programme and year', () => {
      test.beforeEach(async ({ page }) => {
        await initWithGroups(page, '/studyguidancegroups/sgg-cypress-1')
      })

      test('shows the correct labels', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'MAT kandit 2020' })).toBeVisible()
        await expect(page.getByLabel('Associated degree programme')).toHaveText('Matemaattisten tieteiden kandiohjelma')
        await expect(page.getByLabel('Associated starting academic')).toHaveText('2020 - 2021')
      })

      test('shows the correct panes', async ({ page }) => {
        await expect(page.getByTestId('Credit accumulation (for 3 students)')).toBeVisible()
        await expect(page.getByTestId('Credit statistics')).toBeVisible()
        await expect(page.getByTestId('Age distribution')).toBeVisible()
        await expect(page.getByTestId('Courses of population')).toBeVisible()
        await expect(page.getByText('Students (3)')).toBeVisible()
      })

      test("clicking the 'Show credits starting from the associated academic year' filter", async ({ page }) => {
        const filter = page.getByTestId('ParticipationDate-filter-card')
        await expect(filter).toHaveAttribute('data-active', 'false')
        await page.getByTestId('Credit accumulation (for 3 students)').click()
        await page.getByText('Show credits starting from the associated academic year').click()

        await expect(filter).toHaveAttribute('data-active', 'true')
        await expect(page.locator('.date-picker').first().locator('input')).toHaveValue('01.08.2020')
        await expect(page.getByText('Reset All Filters')).toBeVisible()
        await page.getByText('Show credits starting from the associated academic year').click()
        await expect(filter).toHaveAttribute('data-active', 'false')
      })

      test('students table has the correct tabs', async ({ page }) => {
        await page.getByText('Students (3)').click()
        await expect(page.getByTestId('student-table-tabs').getByRole('tab')).toHaveText([
          'General',
          'Courses',
          'Modules',
          'Progress',
        ])
      })

      test('general tab of the students table has the correct columns', async ({ page }) => {
        const columns = [
          'Student number',
          'Status',
          'Credits',
          'Prior to bachelor',
          'Start date',
          'Graduation date',
          'Semesters present',
          'Study track',
          'Other programmes',
          'Transferred From',
          'Admission Type',
          'Gender',
          'Citizenships',
          'Curriculum period',
          'Latest attainment date',
          'TVEX',
          'Tags',
          'Total',
          'In study plan',
          'Since start in programme',
          'Credits',
          'Courses',
          'University',
          'Study right',
          'Programme',
        ]
        await page.getByText('Students (3)').click()
        await expect(page.getByTestId('ooditable-general').locator('table thead th')).toHaveText(columns)
      })
    })

    test('has a working back button', async ({ page }) => {
      await initWithGroups(page, '/studyguidancegroups/sgg-cypress-1')
      await page.getByRole('button', { name: 'Back to groups' }).click()
      await expect(page).toHaveURL('/studyguidancegroups')
    })
  })
})
