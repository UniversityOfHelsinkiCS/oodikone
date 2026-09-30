import { describe, expect, it } from 'vitest'

import './initTests'

import { mapStudyrightExtent } from '@/updater/mapper'

describe('mapStudyrightExtent', () => {
  it('resolves the extent code from educationTypeToExtentcode', () => {
    expect(mapStudyrightExtent({ id: 'edu-type-1', name: { fi: 'Koulutus' } })).toEqual({
      extentcode: 1,
      name: { fi: 'Koulutus' },
    })
  })
})
