import { test, expect } from '@playwright/experimental-ct-react'

import { DegreeCoursesTabWrapper } from './DegreeCoursesTabWrapper'

const course = {
  code: 'MAT101',
  group_id: 'group-MAT101',
  module_order: 0,
  name: { fi: 'Calculus I', en: 'Calculus I' },
  parent_code: 'MOD1',
  parent_name: { fi: 'Basic studies', en: 'Basic studies' },
  visible: { id: null, visibility: true },
}

const emptyYears = { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] }

test.describe('DegreeCoursesTab', () => {
  test.beforeEach(async ({ router }) => {
    await router.route('**/api/login', route => route.fulfill({ json: { user: { roles: [] } } }))
    await router.route('**/api/banners', route => route.fulfill({ json: [] }))
    await router.route('**/api/populationstatistics/studyprogrammes', route =>
      route.fulfill({
        json: {
          allProgrammes: { KH90_001: { name: { fi: 'Lääketieteen kandiohjelma', en: 'Medicine (bachelor)' } } },
          filteredProgrammes: {},
        },
      })
    )
    await router.route('**/api/curriculum-options/*', route =>
      route.fulfill({ json: [{ id: 'cur-1', name: '2023–2026', periodIds: ['period-1'], validFrom: '2023-08-01' }] })
    )
    await router.route('**/api/curriculum/*/*', route =>
      route.fulfill({
        json: {
          defaultProgrammeCourses: [course],
          defaultProgrammeModules: [],
          secondProgrammeCourses: [],
          secondProgrammeModules: [],
        },
      })
    )
    await router.route('**/api/programme-criteria?*', route =>
      route.fulfill({
        json: {
          allCourseGroups: {},
          courses: emptyYears,
          credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
        },
      })
    )
    await router.route('**/api/course-exclusions/', route => route.fulfill({ json: [] }))
  })

  test('shows the global settings warning and opens the criteria tab by default', async ({ mount }) => {
    const component = await mount(<DegreeCoursesTabWrapper programme="KH50_001" />)

    await expect(component.getByRole('alert')).toContainText(/non-personal|eivät ole henkilökohtaisia/)
    await expect(component.locator('[data-cy="criteria-panel"] [data-cy="curriculum-section"]')).toBeVisible()
    await expect(component.getByRole('tab')).toHaveText(['Progress tab criteria', 'Course & module visibility'])
    await expect(component.getByRole('tab', { name: 'Progress tab criteria' })).toHaveAttribute('aria-selected', 'true')
    await expect(component.locator('[data-cy="credit-criteria-section"]')).toBeVisible()
    await expect(component.locator('[data-cy="visibility-panel"]')).toBeHidden()
  })

  test('opens the given tab and still allows switching to the other one', async ({ mount }) => {
    const component = await mount(<DegreeCoursesTabWrapper initialTab="visibility" programme="KH50_001" />)

    await expect(component.locator('[data-cy="visibility-panel"]')).toBeVisible()
    await expect(component.locator('[data-cy="criteria-panel"]')).toBeHidden()
    await expect(component.locator('[data-cy="visibility-panel"] [data-cy="curriculum-section"]')).toBeVisible()

    await component.getByRole('tab', { name: 'Progress tab criteria' }).click()

    await expect(component.locator('[data-cy="criteria-panel"]')).toBeVisible()
    await expect(component.locator('[data-cy="visibility-panel"]')).toBeHidden()
  })

  test('keeps visibility changes when switching tabs', async ({ mount }) => {
    const component = await mount(<DegreeCoursesTabWrapper initialTab="visibility" programme="KH50_001" />)
    const visibilityPanel = component.locator('[data-cy="visibility-panel"]')

    await visibilityPanel.getByText('Basic studies').click()
    await visibilityPanel.getByRole('checkbox', { name: 'Show Calculus I' }).uncheck()
    await component.getByRole('tab', { name: 'Progress tab criteria' }).click()
    await component.getByRole('tab', { name: 'Course & module visibility' }).click()

    await expect(visibilityPanel.getByRole('checkbox', { name: 'Show Calculus I' })).not.toBeChecked()
  })

  test('has no tabs for a programme without progress criteria', async ({ mount }) => {
    const component = await mount(<DegreeCoursesTabWrapper programme="MH50_001" />)

    await expect(component.locator('[data-cy="visibility-panel"]')).toBeVisible()
    await expect(component.getByRole('tab')).toHaveCount(0)
    await expect(component.locator('[data-cy="credit-criteria-section"]')).toHaveCount(0)
  })

  test('combined programme shows both curriculums in one table', async ({ mount, router }) => {
    await router.route('**/api/curriculum/*/*', route =>
      route.fulfill({
        json: {
          defaultProgrammeCourses: [course],
          defaultProgrammeModules: [],
          secondProgrammeCourses: [
            {
              ...course,
              code: 'LK101',
              group_id: 'group-LK101',
              name: { fi: 'Anatomy', en: 'Anatomy' },
              parent_code: 'MOD2',
              parent_name: { fi: 'Clinical studies', en: 'Clinical studies' },
            },
          ],
          secondProgrammeModules: [],
        },
      })
    )
    const component = await mount(<DegreeCoursesTabWrapper programme="KH90_001" />)
    const criteriaPanel = component.locator('[data-cy="criteria-panel"]')

    await expect(criteriaPanel.locator('[data-cy="degree-course-table"]')).toHaveCount(1)
    await expect(criteriaPanel.locator('[data-cy="programme-row-KH90_001"]')).toContainText(
      /Lääketieteen kandiohjelma|Medicine \(bachelor\)/
    )
    // Programme without a known name falls back to its code
    await expect(criteriaPanel.locator('[data-cy="programme-row-MH90_001"]')).toHaveText('MH90_001 (MH90_001)')
    await expect(criteriaPanel.getByText('Basic studies')).toBeVisible()
    await expect(criteriaPanel.getByText('Clinical studies')).toBeVisible()
    await expect(criteriaPanel.getByRole('columnheader', { name: 'Year 6' })).toBeVisible()
  })

  test('shows a loading indicator until the curriculum has loaded', async ({ mount, router }) => {
    let releaseCurriculum!: () => void
    const curriculumGate = new Promise<void>(resolve => {
      releaseCurriculum = resolve
    })
    await router.route('**/api/curriculum/*/*', async route => {
      await curriculumGate
      await route.fulfill({
        json: {
          defaultProgrammeCourses: [course],
          defaultProgrammeModules: [],
          secondProgrammeCourses: [],
          secondProgrammeModules: [],
        },
      })
    })
    const component = await mount(<DegreeCoursesTabWrapper programme="KH50_001" />)

    await expect(component.locator('[data-cy="degree-settings-loading"]')).toBeVisible()
    await expect(component.getByRole('tab')).toHaveCount(0)

    releaseCurriculum()

    await expect(component.getByRole('tab', { name: 'Progress tab criteria' })).toBeVisible()
    await expect(component.locator('[data-cy="degree-settings-loading"]')).toHaveCount(0)
  })

  test('tells when the programme has no curriculum', async ({ mount, router }) => {
    await router.route('**/api/curriculum-options/*', route => route.fulfill({ json: [] }))
    const component = await mount(<DegreeCoursesTabWrapper programme="KH50_001" />)

    await expect(component.getByText('No curriculum found for this programme')).toBeVisible()
    await expect(component.locator('[data-cy="degree-settings-loading"]')).toHaveCount(0)
  })

  test('shows an error when loading fails', async ({ mount, router }) => {
    await router.route('**/api/programme-criteria?*', route => route.fulfill({ status: 500, json: {} }))
    const component = await mount(<DegreeCoursesTabWrapper programme="KH50_001" />)

    await expect(component.getByText('Something went wrong, please try refreshing the page')).toBeVisible()
    await expect(component.locator('[data-cy="degree-settings-loading"]')).toHaveCount(0)
  })
})
