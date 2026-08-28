import { describe, expect, it } from 'vitest'

import './initTests.js'

import { courseProviderMapper } from '@/updater/mapper.js'

describe('courseProviderMapper', () => {
  it('maps organisation shares to a course provider row', () => {
    const mapProvider = courseProviderMapper('CG1')
    expect(mapProvider({ organisationId: 'org1', shares: 50 })).toEqual({
      coursecode: 'CG1',
      organizationcode: 'org1',
      shares: 50,
    })
  })
})
