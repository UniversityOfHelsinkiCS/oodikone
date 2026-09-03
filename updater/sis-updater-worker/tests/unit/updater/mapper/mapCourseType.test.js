import { describe, expect, it } from 'vitest'

import './initTests.js'

import { mapCourseType } from '@/updater/mapper.js'

describe('mapCourseType', () => {
  it('maps a study level to a course type row', () => {
    expect(mapCourseType({ id: 'lvl1', name: { fi: 'Taso' } })).toEqual({
      coursetypecode: 'lvl1',
      name: { fi: 'Taso' },
    })
  })
})
