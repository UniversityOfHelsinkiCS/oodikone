import { expect, test, type Page } from '@playwright/test'
import { init } from './support/commands'

const students1 = ['433237', '457144', '458090', '465136']
const students2 = ['474270', '479440', '470391', '474789']
const nonExistentStudentNumbers = ['123', 'X', '-']

const fillForm = async (page: Page, studentNumbers: string[], separator: string) => {
  // NOTE: This helper uses pressSequentially instead of the normal fill so that it can append to a textfield
  await page.getByTestId('student-number-input').getByRole('textbox').pressSequentially(studentNumbers.join(separator))
}

const search = async (page: Page) => {
  await page.getByTestId('search-button').click()
}

const searchFor = async (page: Page, studentNumbers: string[], separator: string) => {
  await fillForm(page, studentNumbers, separator)
  await search(page)
}

const hasLanded = async (page: Page) => {
  await expect(page.getByText('Credit accumulation')).toBeVisible()
  await expect(page.getByText('Programme distribution')).toBeVisible()
  await expect(page.getByText('Courses of population')).toBeVisible()
  await expect(page.getByText('Students (4)')).toBeVisible()
}

const containsAmountOfStudents = async (page: Page, amount = 0) => {
  await expect(page.getByText(`Credit accumulation (for ${amount} students)`)).toBeVisible()
  await expect(page.getByText(`Students (${amount})`)).toBeVisible()
}

const containsSpecificStudents = async (page: Page, studentNumbers: string[]) => {
  const studentsTab = page.getByText(`Students (${studentNumbers.length})`)
  await studentsTab.click()
  await Promise.all(studentNumbers.map(async number => await expect(page.getByText(number)).toBeVisible()))
}

const checkRightsNotification = async (page: Page, studentNumbers: string[]) => {
  const notification = page.getByTestId('rights-notification')
  await expect(notification).toContainText(
    'The following students information could not be displayed. This could be either because they do not exist, or you do not have the right to view their information.'
  )
  await Promise.all(studentNumbers.map(number => expect(notification.locator('li').getByText(number)).toBeVisible()))
}

const fillName = async (page: Page) => {
  const name = `TEST-${Date.now()}`
  await expect(page.getByText('Insert a name for this custom population if you wish to save it')).toBeVisible()
  await page.getByTestId('custom-population-name-input').getByRole('textbox').fill(name)
  return name
}

const selectSavedPopulation = async (page: Page, name: string) => {
  const searchInput = page.getByTestId('history-search').getByRole('combobox')
  await searchInput.fill(name)
  await searchInput.press('Enter')
}

const save = async (page: Page, name: string) => {
  await page.getByRole('button', { name: 'Save' }).click()
  // Wait for saved custom pop to be visible
  await page.getByTestId('history-search').click()
  await expect(page.getByText(name)).toBeVisible()
}

const deleteAllSearches = async (page: Page) => {
  if (await page.getByTestId('history-search').isVisible()) {
    const searchInput = page.getByTestId('history-search')
    await searchInput.click()
    const options = page.getByRole('cell')

    while (await options.count()) {
      await options.first().click()
      await page.getByRole('button', { name: 'Delete' }).click()
      await searchInput.click()
    }
  }
}

test.describe('Custom population tests', () => {
  test.beforeEach(async ({ page }) => {
    await init(page, '/custompopulation')
    await expect(page).toHaveURL(/\/custompopulation/)
    await expect(page.getByRole('heading', { name: 'Custom population', exact: true })).toBeVisible()
  })

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await init(page, '/custompopulation')
    await deleteAllSearches(page)
    await context.close()
  })

  test.describe('Custom population searching', () => {
    test('Finds a proper population', async ({ page }) => {
      await searchFor(page, students1, '\n')
      await hasLanded(page)
      await containsAmountOfStudents(page, students1.length)
      await containsSpecificStudents(page, students1)
    })

    test("Doesn't return non-existing students", async ({ page }) => {
      await searchFor(page, [...students1, ...nonExistentStudentNumbers], ' ')
      await hasLanded(page)
      await containsAmountOfStudents(page, students1.length)
      await containsSpecificStudents(page, students1)
      await checkRightsNotification(page, nonExistentStudentNumbers)
    })

    test("Doesn't find empty custom population", async ({ page }) => {
      await searchFor(page, nonExistentStudentNumbers, ',')
      await checkRightsNotification(page, nonExistentStudentNumbers)
      await expect(page.getByText('Credit accumulation')).not.toBeVisible()
      await expect(page.getByText('Programme distribution')).not.toBeVisible()
      await expect(page.getByText('Courses of population')).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Back to search form' })).toBeVisible()
    })

    test("Doesn't return students user has no right to", async ({ page }) => {
      const studentsForEduBachStudents = ['014990067', '013069465', '014853890']
      await searchFor(page, studentsForEduBachStudents, ';;')
      await checkRightsNotification(page, studentsForEduBachStudents)
      await expect(page.getByText('Credit accumulation')).not.toBeVisible()
      await expect(page.getByText('Programme distribution')).not.toBeVisible()
      await expect(page.getByText('Courses of population')).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Back to search form' })).toBeVisible()
    })
  })

  test.describe('Custom population by programme', () => {
    test('Finds students of programmes matching a prefix', async ({ page }) => {
      await page.getByTestId('search-mode').click()
      await expect(page.getByTestId('search-button')).toBeDisabled()

      await page.getByTestId('custom-population-programme-prefix-input').fill('KH50')
      await page.getByTestId('custom-population-add-by-prefix-button').click()
      await expect(page.getByText('KH50_001')).toBeVisible()

      await page.getByTestId('population-year-selector').click()
      await page.getByText('2020 - 2021').click()

      await page.getByTestId('search-button').click()
      await expect(page.getByText('Credit accumulation')).toBeVisible()
      await expect(page.getByText('Courses of population')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Back to search form' })).toBeVisible()
    })
  })

  test.describe('Custom population search saving', () => {
    test('Saves a custom population search', async ({ page }) => {
      const name = await fillName(page)
      await fillForm(page, students1, ',\n')
      await save(page, name)

      await selectSavedPopulation(page, name)
      await search(page)
      await expect(page.getByText(`Custom population: ${name}`)).toBeVisible()
      await containsAmountOfStudents(page, students1.length)
      await containsSpecificStudents(page, students1)

      await page.goto('/custompopulation')
      await expect(page.getByRole('heading', { name: 'Custom population', exact: true })).toBeVisible()
      await selectSavedPopulation(page, name)
      await search(page)
      await expect(page.getByText(`Custom population: ${name}`)).toBeVisible()
      await containsAmountOfStudents(page, students1.length)
      await containsSpecificStudents(page, students1)
    })

    test('Updates a custom population search', async ({ page }) => {
      const name = await fillName(page)
      await fillForm(page, students1, ' ')
      await save(page, name)

      await selectSavedPopulation(page, name)
      await search(page)
      await expect(page.getByText(`Custom population: ${name}`)).toBeVisible()
      await containsAmountOfStudents(page, students1.length)
      await containsSpecificStudents(page, students1)
      await page.getByRole('button', { name: 'Back to search form' }).click()
      await selectSavedPopulation(page, name)
      await fillForm(page, ['\n', ...students2], ', ')
      await save(page, name)

      await page.goto('/custompopulation')
      await expect(page.getByRole('heading', { name: 'Custom population', exact: true })).toBeVisible()
      await selectSavedPopulation(page, name)
      await search(page)
      await expect(page.getByText(`Custom population: ${name}`)).toBeVisible()
      await containsAmountOfStudents(page, students1.length + students2.length)
      await containsSpecificStudents(page, [...students1, ...students2])
    })
  })
})
