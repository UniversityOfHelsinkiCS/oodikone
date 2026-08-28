import { describe, expect, it } from 'vitest'

import './initTests.js'

import { mapCurriculumPeriod } from '@/updater/mapper.js'

describe('mapCurriculumPeriod', () => {
  it('maps a curriculum period correctly', () => {
    expect(
      mapCurriculumPeriod({
        id: 'cp1',
        name: { fi: 'Kausi' },
        university_org_id: 'org1',
        active_period: { startDate: '2020-01-01', endDate: '2020-12-31' },
      })
    ).toEqual({
      id: 'cp1',
      name: { fi: 'Kausi' },
      universityOrgId: 'org1',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-12-31'),
    })
  })
})
