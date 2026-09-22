import { test, expect } from '@playwright/experimental-ct-react'

import { PopulationStudentsWrapper } from './PopulationStudentsWrapper'

test.describe('PopulationStudents', () => {
  test.beforeEach(async ({ router }) => {
    await router.route('**/api/populationstatistics/studyprogrammes', route =>
      route.fulfill({ json: { filteredProgrammes: {}, allProgrammes: {} } })
    )
    await router.route('**/api/login', route => route.fulfill({ json: { user: { roles: [] } } }))
    await router.route('**/api/banners', route => route.fulfill({ json: [] }))
  })

  test('shows the Progress tab for a single year of a bachelor programme', async ({ mount, page }) => {
    await page.goto('/?years=2020')
    const component = await mount(<PopulationStudentsWrapper programme="KH50_005" />)

    await expect(component.getByRole('tab')).toHaveText(['General', 'Courses', 'Modules', 'Tags', 'Progress'])
  })

  test('hides the Progress tab when multiple years are selected', async ({ mount, page }) => {
    await page.goto('/?years=2020&years=2021')
    const component = await mount(<PopulationStudentsWrapper programme="KH50_005" />)

    await expect(component.getByRole('tab')).toHaveText(['General', 'Courses', 'Modules', 'Tags'])
  })

  test('hides the Progress tab for a non-bachelor programme', async ({ mount, page }) => {
    await page.goto('/?years=2020')
    const component = await mount(<PopulationStudentsWrapper programme="MH50_001" />)

    await expect(component.getByRole('tab')).toHaveText(['General', 'Courses', 'Modules', 'Tags'])
  })
})
