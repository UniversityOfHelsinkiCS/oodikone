import { test, expect } from '@playwright/experimental-ct-react'

import { CourseStatistics } from '@/pages/CourseStatistics'
import { ReduxWrapper } from '../../ReduxWrapper'

test.describe('Course statistics search', () => {
  test.beforeEach(async ({ router }) => {
    void (await router.route('**/api/login', async route => {
      const json = { user: { roles: ['admin'] } }
      await route.fulfill({ json })
    }))

    void (await router.route('**/api/courseyearlystats*', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/codes', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/maxYearsToCreatePopulationFrom*', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/courseyearlystats*', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/coursesmulti*', async route => {
      const json = {
        courses: [
          {
            code: 'TKT10002',
            name: { fi: 'Ohjelmoinnin perusteet' },
            substitution_groups: [],
          },
          {
            code: 'TKT10003',
            name: { fi: 'Ohjelmoinnin jatkokurssi' },
            substitution_groups: [],
          },
        ],
      }
      void (await route.fulfill({ json }))
    }))
  })

  test('should mount correctly', async ({ mount }) => {
    const component = await mount(<ReduxWrapper component={<CourseStatistics />} />)
    await expect(component).toContainText('Course statistics')
  })

  test('should return courses with matching name', async ({ mount }) => {
    const component = await mount(<ReduxWrapper component={<CourseStatistics />} />)
    await expect(component).toContainText('Search for courses')
    await component.getByLabel('Name').fill('Ohjelmoinnin')
    await expect(component).toContainText('Ohjelmoinnin perusteet')
    await expect(component).toContainText('Ohjelmoinnin jatkokurssi')
  })

  test('should return courses with matching code', async ({ mount }) => {
    const component = await mount(<ReduxWrapper component={<CourseStatistics />} />)
    await expect(component).toContainText('Search for courses')
    await component.getByLabel('Code').fill('TKT')
    await expect(component).toContainText('Ohjelmoinnin perusteet')
    await expect(component).toContainText('Ohjelmoinnin jatkokurssi')
  })
})

test.describe('Course statistics', () => {
  test.beforeEach(async ({ router }) => {
    void (await router.route('**/api/login', async route => {
      const json = { user: { roles: ['admin'] } }
      await route.fulfill({ json })
    }))

    void (await router.route('**/api/courseyearlystats*', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/codes', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/maxYearsToCreatePopulationFrom*', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/courseyearlystats*', async route => {
      const json = [
        {
          unifyStats: {
            courseCode: 'TKT10002',
            name: { fi: 'Ohjelmoinnin perusteet' },
            statistics: [],
          },
          regularStats: {},
          openStats: {},
        },
      ]
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/coursesmulti*', async route => {
      const json = {
        courses: [
          {
            code: 'TKT10002',
            name: { fi: 'Ohjelmoinnin perusteet' },
            substitution_groups: [],
            min_attainment_date: new Date('2021-08-01').toString(),
            max_attainment_date: new Date('2022-08-01').toString(),
          },
          {
            code: 'TKT10003',
            name: { fi: 'Ohjelmoinnin jatkokurssi' },
            substitution_groups: [],
            min_attainment_date: new Date('2021-08-01').toString(),
            max_attainment_date: new Date('2022-08-01').toString(),
          },
        ],
      }
      void (await route.fulfill({ json }))
    }))
  })

  // TODO: Finish this
  test.skip('should open a course when clicked', async ({ mount }) => {
    const component = await mount(<ReduxWrapper component={<CourseStatistics />} />)
    await expect(component).toContainText('Search for courses')

    await component.getByLabel('Combine substitutions').click()
    await component.getByLabel('Code').fill('TKT')

    await expect(component).toContainText('Ohjelmoinnin perusteet')
    await component.getByRole('cell', { name: 'Ohjelmoinnin perusteet' }).click()

    await expect(component).toContainText('Selected course')
  })
})
