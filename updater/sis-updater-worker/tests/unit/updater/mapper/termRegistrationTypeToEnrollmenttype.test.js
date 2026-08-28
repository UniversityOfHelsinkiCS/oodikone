import { describe, expect, it } from 'vitest'

import './initTests.js'

import { termRegistrationTypeToEnrollmenttype } from '@/updater/mapper.js'

describe('termRegistrationTypeToEnrollmenttype', () => {
  it('maps known types and falls back to 3', () => {
    expect(termRegistrationTypeToEnrollmenttype('ATTENDING')).toBe(1)
    expect(termRegistrationTypeToEnrollmenttype('NONATTENDING')).toBe(2)
    expect(termRegistrationTypeToEnrollmenttype('SOMETHING_ELSE')).toBe(3)
  })
})
