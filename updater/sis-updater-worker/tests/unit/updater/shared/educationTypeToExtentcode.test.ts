import { describe, expect, it } from 'vitest'

import './initTests'

import { educationTypeToExtentcode } from '@/updater/shared'

describe('educationTypeToExtentcode', () => {
  it('maps known education types to their extent code', () => {
    expect(educationTypeToExtentcode['urn:code:education-type:degree-education:bachelors-degree']).toBe(1)
    expect(educationTypeToExtentcode['urn:code:education-type:degree-education:masters-degree']).toBe(2)
  })

  it('maps education types without their own extent code to null', () => {
    expect(
      educationTypeToExtentcode['urn:code:education-type:non-degree-education:agreement-studies:joo-studies']
    ).toBeNull()
  })
})
