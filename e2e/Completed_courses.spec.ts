import { expect, test, type Page } from '@playwright/test'
import { init } from './support/commands'

const studentSet1 = ['433237', '457144', '458090', '474270', '479440']
const coursesSet1 = ['TKT10001', 'TKT10002', 'TKT10003', 'TKT10004']

const hasLanded = async (page: Page) => {
  await expect(page.getByRole('button', { name: 'Search completed courses of students' })).toBeVisible()
  await expect(
    page.getByText(
      'Here you can search by a list of student and course numbers to see whether students have completed certain courses yet'
    )
  ).toBeVisible()
}

const openSearch = async (page: Page) => {
  await init(page, '/completedcoursessearch')
  await hasLanded(page)
}

const openCompletedCoursesModal = async (page: Page) => {
  await page.getByRole('button', { name: 'Search completed courses of students' }).click()
}

const selectSavedCourselist = async (page: Page, name: string) => {
  const searchInput = page.getByTestId('history-search').getByRole('combobox')
  await searchInput.fill(name)
  await page.getByRole('option', { name }).click()
}

const deleteAllPreviousSearches = async (page: Page) => {
  const historySearch = page.getByTestId('history-search').getByRole('combobox')

  while (await historySearch.isVisible()) {
    await historySearch.click()
    const options = page.getByRole('option')
    if ((await options.count()) === 0) break
    await options.first().click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('button', { name: 'Delete' })).toBeDisabled()
  }
  await expect(page.getByText('You have no previous searches.')).toBeVisible()
}

const createCourseList = async (page: Page, courseCodes: string[], courseListName: string) => {
  await openSearch(page)
  await openCompletedCoursesModal(page)
  await page.getByTestId('course-list-input').getByRole('textbox').fill(courseCodes.join('\n'))
  await page.getByTestId('search-name').getByRole('textbox').fill(courseListName)
  await page.getByRole('button', { name: 'Save' }).click()
}

const generateCourseListName = () => `TEST-course-list-${Date.now()}`

test.describe('When search modal is opened', () => {
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await openSearch(page)
    await openCompletedCoursesModal(page)
    if (await page.getByTestId('history-search').getByRole('combobox').isVisible()) {
      await deleteAllPreviousSearches(page)
    }
    await context.close()
  })

  test('Modal opens correctly', async ({ page }) => {
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await expect(page.getByRole('dialog')).toContainText('Search completed courses of students')
    await expect(
      page.getByText('Insert one or more student numbers, separated by a space, a newline, a comma, or a semicolon.')
    ).toBeVisible()
    await expect(
      page.getByText('Insert one or more courses, separated by a space, a newline, a comma, or a semicolon.')
    ).toBeVisible()
    await expect(page.getByText('Insert name for this course list if you wish to save it')).toBeVisible()
  })

  test('Modal gets the correct course codes and student numbers from the URL', async ({ page }) => {
    await init(
      page,
      '/completedcoursessearch?courseList=TKT10001&courseList=TKT10002&studentList=433237&studentList=457144'
    )
    await hasLanded(page)
    await openCompletedCoursesModal(page)
    await expect(page.getByTestId('student-no-input').getByRole('textbox')).toHaveValue('433237, 457144')
    await expect(page.getByTestId('course-list-input').getByRole('textbox')).toHaveValue('TKT10001, TKT10002')
  })

  test('Returns empty table and notification for invalid input', async ({ page }) => {
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await page.getByTestId('student-no-input').getByRole('textbox').fill('1')
    await page.getByTestId('course-list-input').getByRole('textbox').fill('1')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByTestId('rights-notification')).toContainText(
      'The information for the following students could not be displayed'
    )
    await expect(page.getByTestId('rights-notification')).toContainText('1')
    const table = page.getByTestId('completed-courses-table-div')
    await expect(table).toContainText('Student number')
    await expect(table.getByText('1', { exact: true })).toHaveCount(0)
  })

  test.describe('When a search with correct data is executed', () => {
    test.beforeEach(async ({ page }) => {
      await openSearch(page)
      await openCompletedCoursesModal(page)
      await page.getByTestId('student-no-input').getByRole('textbox').fill(studentSet1.join('\n'))
      await page.getByTestId('course-list-input').getByRole('textbox').fill(coursesSet1.join('\n'))
      await page.getByRole('button', { name: 'Search' }).click()
    })

    test('Pushes the query to url', async ({ page }) => {
      await expect(page).toHaveURL(
        new RegExp(
          `/completedcoursessearch\\?courseList=${coursesSet1.join('&courseList=')}&studentList=${studentSet1.join('&studentList=')}`
        )
      )
    })

    test('Finds correct students and courses', async ({ page }) => {
      const table = page.getByTestId('completed-courses-table-div')
      for (const studentNumber of studentSet1) await expect(table).toContainText(studentNumber)
      for (const courseCode of coursesSet1) await expect(table).toContainText(courseCode)
    })
  })
})

test.describe('Courselist saving-related functions work', () => {
  test.beforeEach(async ({ page }) => {
    await openSearch(page)
    await openCompletedCoursesModal(page)
    if (await page.getByTestId('history-search').getByRole('combobox').isVisible()) {
      await deleteAllPreviousSearches(page)
    } else {
      await expect(page.getByText('You have no previous searches.')).toBeVisible()
    }
  })

  test('Course list can be saved', async ({ page }) => {
    const courseList = generateCourseListName()
    const courses = ['CSM14204', 'TKT10004']
    await createCourseList(page, courses, courseList)
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await selectSavedCourselist(page, courseList)
    await expect(page.getByTestId('course-list-input').getByRole('textbox')).toHaveValue(courses.join(', '))
  })

  test('Course list can be deleted', async ({ page }) => {
    const courseList = generateCourseListName()
    await createCourseList(page, ['CSM14204', 'TKT10004'], courseList)
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await selectSavedCourselist(page, courseList)
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('You have no previous searches.')).toBeVisible()
  })

  test('Course list can be updated', async ({ page }) => {
    const courseList = generateCourseListName()
    await createCourseList(page, ['CSM14204', 'TKT10004'], courseList)
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await selectSavedCourselist(page, courseList)
    await page.getByTestId('course-list-input').getByRole('textbox').pressSequentially(',TKT10001')
    await page.getByRole('button', { name: 'Save' }).click()
    await openSearch(page)
    await openCompletedCoursesModal(page)
    await selectSavedCourselist(page, courseList)
    await expect(page.getByTestId('course-list-input').getByRole('textbox')).toHaveValue('CSM14204, TKT10004, TKT10001')
  })
})
