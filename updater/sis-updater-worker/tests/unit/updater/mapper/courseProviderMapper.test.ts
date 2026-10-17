import { describe, expect, it } from 'vitest'

import './initTests'

import { courseProviderMapper } from '@/updater/mapper'

describe('courseProviderMapper', () => {
  it('maps organisation shares to a course provider row', () => {
    const mapProvider = courseProviderMapper('CG1')
    expect(mapProvider({ organisationId: 'org1', shares: 1 })).toEqual({
      coursecode: 'CG1',
      organizationcode: 'org1',
      shares: 1,
    })
  })
})
