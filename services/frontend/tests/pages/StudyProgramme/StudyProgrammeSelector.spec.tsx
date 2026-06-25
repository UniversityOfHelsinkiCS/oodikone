import { test, expect } from '@playwright/experimental-ct-react'

import { StudyProgrammeSelector } from '@/pages/StudyProgramme/StudyProgrammeSelector'
import { ReduxWrapper } from '../../ReduxWrapper'

const testProgrammes = {
  filteredProgrammes: {
    KH50_001: {
      code: 'KH50_001',
      curriculumPeriodIds: ['hy-lv-76'],
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Mathematical Sciences",
        fi: 'Matemaattisten tieteiden kandiohjelma',
        sv: 'Kandidatsprogrammet i matematiska vetenskaper',
      },
      progId: 'MAT',
    },
    MH50_001: {
      code: 'MH50_001',
      curriculumPeriodIds: ['hy-lv-76'],
      degreeProgrammeType: 'urn:code:degree-program-type:masters-degree',
      name: {
        en: "Master's Programme in Mathematics and Statistics",
        fi: 'Matematiikan ja tilastotieteen maisteriohjelma',
        sv: 'Magisterprogrammet i matematik och statistik',
      },
      progId: 'MAST',
    },
    KH90_001: {
      code: 'KH90_001',
      curriculumPeriodIds: ['hy-lv-76'],
      degreeProgrammeType: 'urn:code:degree-program-type:bachelors-degree',
      name: {
        en: "Bachelor's Programme in Veterinary Medicine",
        fi: 'Eläinlääketieteen kandiohjelma',
        sv: 'Kandidatsprogrammet i veterinärmedicin',
      },
      progId: 'ELK',
    },
    MH90_001: {
      code: 'MH90_001',
      curriculumPeriodIds: ['hy-lv-76'],
      degreeProgrammeType: 'urn:code:degree-program-type:masters-degree',
      name: {
        en: 'Degree Programme in Veterinary Medicine',
        fi: 'Eläinlääketieteen lisensiaatin koulutusohjelma',
        sv: 'Utbildningsprogrammet i veterinärmedicin',
      },
      progId: 'ELL',
    },
    T923105: {
      code: 'T923105',
      curriculumPeriodIds: ['hy-lv-76'],
      degreeProgrammeType: 'urn:code:degree-program-type:doctor',
      name: {
        en: 'Doctoral Programme in Mathematics and Statistics',
        fi: 'Matematiikan ja tilastotieteen tohtoriohjelma',
        sv: 'Doktorandprogrammet i matematik och statistik',
      },
      progId: 'DOMAST',
    },
  },
  allProgrammes: {},
}

test.describe('StudyProgrammeSelector', () => {
  test.beforeEach(async ({ router }) => {
    void (await router.route('**/api/populationstatistics/studyprogrammes', async route => {
      const json = {}
      await route.fulfill({ json })
    }))

    void (await router.route('**/api/curriculum-periods', async route => {
      const json = [
        {
          id: 'hy-lv-76',
          startDate: '2025-08-01T00:00:00.000Z',
          endDate: '2026-08-01T00:00:00.000Z',
        },
      ]

      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/study-programme-pins', async route => {
      const json = {}
      void (await route.fulfill({ json }))
    }))

    void (await router.route('**/api/study-programme-pins', async route => {
      const json = {}
      await route.fulfill({ json })
    }))

    void (await router.route('**/api/login', async route => {
      const json = { user: { roles: ['admin'] } }
      await route.fulfill({ json })
    }))
  })

  test('should mount correctly', async ({ mount }) => {
    const component = await mount(<ReduxWrapper component={<StudyProgrammeSelector />} />)
    await expect(component).toContainText('Degree programmes')
  })

  test('should display correct categories', async ({ mount, router }) => {
    void (await router.route('**/populationstatistics/studyprogrammes', async route => {
      const json = testProgrammes
      await route.fulfill({ json })
    }))

    const component = await mount(<ReduxWrapper component={<StudyProgrammeSelector />} />)
    await expect(component).toContainText('Bachelor programmes')
    await expect(component).toContainText('Master programmes')
    await expect(component).toContainText('Combined programmes')
    await expect(component).toContainText('Doctoral programmes')
  })
})
