import { expect, test, type Page } from '@playwright/test'
import { init } from './support/commands'

const checkFilteredStudentCount = async (page: Page, count: number) => {
  await expect(page.getByText(`Students (${count})`)).toBeVisible()
}

const notYetImplemented = () => {
  test.skip(true, 'TODO')
}

const selectDropdownOption = async (page: Page, selector: string, option: string | number) => {
  // Only open the filter card if it is closed
  const dropdown = page.getByTestId(`${selector}-selector`)
  if (!(await dropdown.isVisible())) {
    await page.getByTestId(`${selector}-header`).click()
    await expect(dropdown).toBeVisible()
  }

  await dropdown.click()

  const options = page.getByRole('listbox').getByRole('option')
  if (typeof option === 'number') await options.nth(option).click()
  else await options.filter({ hasText: option }).click()
  await page.keyboard.press('Escape') // Close the search box
}

const setRange = async (page: Page, filter: string, min: number, max: number, expected: number) => {
  const card = page.getByTestId(`${filter}-filter-card`)
  await card.getByTestId('FilterRangeStart').locator('input').fill(String(min))
  await card.getByTestId('FilterRangeEnd').locator('input').fill(String(max))
  await checkFilteredStudentCount(page, expected)
}

const pathToMathMSc2020 = '/populations?years=2020&programme=MH50_001&semesters=FALL&semesters=SPRING'
const defaultMScStudents = 26

test.describe("Population statistics with a master's programme", () => {
  test.beforeEach(async ({ page }) => {
    await init(page, pathToMathMSc2020)
  })

  test('Study track filter works', async ({ page }) => {
    await selectDropdownOption(page, 'studyTrackFilter', 'Matematiikka ja soveltava matematiikka (MAST-MSM)')
    await checkFilteredStudentCount(page, 15)
    await page.getByTestId('studyTrackFilter-clear').click()
    await checkFilteredStudentCount(page, defaultMScStudents)
  })

  test('Study right type filter works', async ({ page }) => {
    const filter = page.getByTestId('studyRightTypeFilter-header')
    await filter.click()
    for (const [value, count] of [
      ['Bachelor + master', 24],
      ['Master only', 2],
      ['All', defaultMScStudents],
    ] as const) {
      const option = page
        .getByTestId('studyRightTypeFilter-filter-card')
        .getByRole('radio', { name: value, exact: true })
      await expect(option).not.toBeChecked()
      await option.click()
      await expect(option).toBeChecked()
      await checkFilteredStudentCount(page, count)
    }
    await filter.click()
  })
})

test.describe('Population Statistics', () => {
  test.describe.skip('TODO', () => {
    test('Study right type filter is not visible', async ({ page }) => {
      await init(page, '/populations?years=2020&programme=KH50_001&semesters=FALL&semesters=SPRING')
      await expect(page.getByText('Study right type')).not.toBeVisible()
    })

    test('Transfer filter works and is set to "not transferred" by default', notYetImplemented)
    test('Graduation filter works', notYetImplemented)
    test('Enrollment filter works', notYetImplemented)
    test('Credit filter works', notYetImplemented)
    test('Age filter works', notYetImplemented)
    test('Gender filter works', notYetImplemented)
    test('Starting year filter works', notYetImplemented)
    test('Admission type filter works', notYetImplemented)
    test('Courses filter works', notYetImplemented)
    test('Filter combinations work', notYetImplemented)
    test('"Reset All Filters" button works', notYetImplemented)
  })
})

test.describe('Population Statistics with Bachelor + Master', () => {
  test.beforeEach(async ({ page }) => {
    await init(
      page,
      '/populations?years=2017&programme=KH50_001&showBachelorAndMaster=true&semesters=FALL&semesters=SPRING'
    )
  })

  test('Graduation filter works', async ({ page }) => {
    await page.getByTestId('graduatedFromProgrammeFilter-header').click()

    for (const [value, count] of [
      ["Graduated with Bachelor's", 42],
      ["Graduated with Master's", 18],
      ["Not graduated with Bachelor's", 5],
      ["Not graduated with Master's", 29],
    ] as const) {
      const option = page
        .getByTestId('graduatedFromProgrammeFilter-filter-card')
        .getByRole('radio', { name: value, exact: true })
      await expect(option).not.toBeChecked()
      await option.click()
      await expect(option).toBeChecked()
      await checkFilteredStudentCount(page, count)
    }
  })

  test('Study right status filter works', async ({ page }) => {
    await page.getByTestId('studyRightStatusFilter-header').click()
    for (const [value, count] of [
      ['Active Bachelor study right', 0],
      ['Active Master study right', 0],
      ['Passive Bachelor study right', 5],
      ['Passive Master study right', 24],
    ] as const) {
      const option = page
        .getByTestId('studyRightStatusFilter-filter-card')
        .getByRole('radio', { name: value, exact: true })
      await expect(option).not.toBeChecked()
      await option.click()
      await expect(option).toBeChecked()
      await checkFilteredStudentCount(page, count)
    }
  })
})

test.describe('Course Statistics', () => {
  test('Grade filter works', notYetImplemented)
  test('Programme filter works and defaults to "Attainment"', notYetImplemented)
  test('Age filter works', notYetImplemented)
  test('Gender filter works', notYetImplemented)
  test('Starting year filter works', notYetImplemented)
  test('Filter combinations work', notYetImplemented)
})

test.describe('Custom Population Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await init(page, '/custompopulation')
    const students = ['433237', '457144', '458090', '465136', '474270', '479440', '470391', '474789']
    await page.getByTestId('student-number-input').getByRole('textbox').pressSequentially(students.join('\n'))
    await page.getByTestId('search-button').click()
    await expect(page.getByText('Credit accumulation')).toBeVisible()
  })

  test('Age filter works', async ({ page }) => {
    await page.getByTestId('ageFilter-header').click()
    await setRange(page, 'ageFilter', 24, 28, 4)
  })

  test('Programme filter works and defaults to "Active Study Right"', async ({ page }) => {
    await page.getByTestId('programmeFilter-header').click()

    await expect(page.getByTestId('programmeFilter-mode-selector').getByRole('combobox')).toHaveText(
      'Active Study Right'
    )
    await selectDropdownOption(page, 'programmeFilter', 'Matemaattisten tieteiden kandiohjelma')
    await checkFilteredStudentCount(page, 5)
  })

  test('Gender filter works', async ({ page }) => {
    for (const [value, count] of [
      ['Female (5)', 5],
      ['Male (3)', 3],
      ['Other (0)', 0],
      ['Unknown (0)', 0],
    ] as const) {
      await selectDropdownOption(page, 'genderFilter', value)
      await checkFilteredStudentCount(page, count)
    }
  })

  test('Starting year filter works', async ({ page }) => {
    await selectDropdownOption(page, 'startYearAtUniFilter', 0)
    await checkFilteredStudentCount(page, 2)
  })

  test('Courses filter works', async ({ page }) => {
    const filter = page.getByTestId('courseFilter-header')
    await filter.click()
    await page.getByRole('combobox').fill('MAT11005 - Integraalilaskenta')
    await page.getByRole('option', { name: 'MAT11005 - Integraalilaskenta' }).click()
    await checkFilteredStudentCount(page, 7)
    await page.getByTestId('courseFilter-MAT11005-selector').click()
    await page.getByRole('option', { name: 'Passed' }).click()
    await checkFilteredStudentCount(page, 6)
  })
})
