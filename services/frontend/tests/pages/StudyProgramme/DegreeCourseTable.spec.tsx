import { test, expect } from '@playwright/experimental-ct-react'

import { DegreeCourseTableWrapper } from './DegreeCourseTableWrapper'

test.describe('DegreeCourseTable', () => {
  let criteriaRequests: unknown[]
  let exclusionRequests: { method: string; body: unknown }[]

  test.beforeEach(async ({ router }) => {
    criteriaRequests = []
    exclusionRequests = []
    await router.route('**/api/login', route => route.fulfill({ json: { user: { roles: [] } } }))
    await router.route('**/api/banners', route => route.fulfill({ json: [] }))
    await router.route('**/api/programme-criteria/courses', route => {
      criteriaRequests.push(route.request().postDataJSON())
      return route.fulfill({ json: {} })
    })
    await router.route('**/api/course-exclusions/', route => {
      exclusionRequests.push({ method: route.request().method(), body: route.request().postDataJSON() })
      return route.fulfill({ json: [] })
    })
  })

  test('shows year columns and required course counts instead of criterion labels', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper />)

    await expect(component.getByRole('columnheader')).toHaveText([
      'Name',
      'Code',
      'Visibility',
      'Required for year criteria',
      'Year 1',
      'Year 2',
      'Year 3',
    ])
    await expect(component.getByText('1 / 2')).toBeVisible()
    await expect(component.locator('[data-cy^="programme-row-"]')).toHaveCount(0)
  })

  test('combined programme shows both curriculums in one table, first programme first', async ({ mount, page }) => {
    const component = await mount(<DegreeCourseTableWrapper combined studyProgramme="KH90_001" />)

    await expect(page.locator('[data-cy="degree-course-table"]')).toHaveCount(1)
    await expect(component.getByRole('columnheader', { name: 'Year 6' })).toBeVisible()
    await expect(component.locator('tbody tr')).toHaveText([
      'First programme (KH90_001)',
      /^Basic studies/,
      'Second programme (MH90_001)',
      /^Clinical studies/,
    ])
  })

  test('hiding a course of the second programme only hides it there', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper combined showCriteria={false} studyProgramme="KH90_001" />)

    await component.getByText('Clinical studies').click()
    await component.getByRole('checkbox', { name: 'Show Calculus I' }).uncheck()
    await component.getByText('Basic studies').click()

    const calculusSwitches = component.getByRole('checkbox', { name: 'Show Calculus I' })
    await expect(calculusSwitches.first()).toBeChecked()
    await expect(calculusSwitches.last()).not.toBeChecked()
    await expect
      .poll(() => exclusionRequests)
      .toEqual([
        {
          method: 'POST',
          body: { courseGroupIds: ['group-MAT101'], curriculumVersion: 'period-1', programmeCode: 'MH90_001' },
        },
      ])
  })

  test('shows six years for medicine', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper studyProgramme="KH90_001" />)

    await expect(component.getByRole('columnheader', { name: 'Year 6' })).toBeVisible()
  })

  test('checking a year saves the criteria once', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper />)
    await component.getByText('Basic studies').click()

    const checkbox = component.getByRole('checkbox', { name: 'Linear algebra required for year 1' })
    await checkbox.check()

    await expect(checkbox).toBeChecked()
    await expect(component.getByText('2 / 2')).toBeVisible()
    expect(criteriaRequests).toEqual([{ code: 'KH50_001', courseGroupIds: ['group-MAT101', 'group-MAT102'], year: 1 }])
  })

  test('unchecking a year saves the criteria once', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper />)
    await component.getByText('Basic studies').click()

    await component.getByRole('checkbox', { name: 'Calculus I required for year 1' }).uncheck()

    await expect.poll(() => criteriaRequests).toEqual([{ code: 'KH50_001', courseGroupIds: [], year: 1 }])
  })

  test('visibility-only table hides criteria columns and toggles course visibility', async ({ mount }) => {
    const component = await mount(<DegreeCourseTableWrapper showCriteria={false} />)

    await expect(component.getByRole('columnheader')).toHaveText(['Name', 'Code', 'Visibility'])

    await component.getByText('Basic studies').click()
    await component.getByRole('checkbox', { name: 'Show Calculus I' }).uncheck()

    await expect(component.getByText('Partly shown')).toBeVisible()
    await expect
      .poll(() => exclusionRequests)
      .toEqual([
        {
          method: 'POST',
          body: { courseGroupIds: ['group-MAT101'], curriculumVersion: 'period-1', programmeCode: 'KH50_001' },
        },
      ])
  })

  test('hiding a partly hidden module asks for confirmation', async ({ mount, page }) => {
    const component = await mount(<DegreeCourseTableWrapper partlyHidden />)

    // The switch stays on until the user confirms
    await component.getByRole('checkbox', { name: 'Show all courses of Basic studies' }).click()
    await expect(page.getByRole('dialog')).toContainText('remaining 1 course for all')
    expect(exclusionRequests).toEqual([])

    await page.getByRole('button', { name: 'Hide module' }).click()

    await expect(component.getByText('Hidden', { exact: true })).toBeVisible()
    await expect
      .poll(() => exclusionRequests)
      .toEqual([
        {
          method: 'POST',
          body: { courseGroupIds: ['group-MAT101'], curriculumVersion: 'period-1', programmeCode: 'KH50_001' },
        },
      ])
  })
})
