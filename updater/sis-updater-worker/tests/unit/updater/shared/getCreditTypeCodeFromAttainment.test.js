import { describe, expect, it } from 'vitest'

import './initTests.js'

import { getCreditTypeCodeFromAttainment } from '@/updater/shared.js'

describe('getCreditTypeCodeFromAttainment', () => {
  it('is FAILED when the grade did not pass', () => {
    expect(getCreditTypeCodeFromAttainment({ primary: true, state: 'ATTAINED' }, false)).toBe(10)
  })

  it('is FAILED when the state is FAILED, even if passed is true', () => {
    expect(getCreditTypeCodeFromAttainment({ primary: true, state: 'FAILED' }, true)).toBe(10)
  })

  it('is IMPROVED for a passed, non-primary attainment', () => {
    expect(getCreditTypeCodeFromAttainment({ primary: false, state: 'ATTAINED' }, true)).toBe(7)
  })

  it('is PASSED for a passed, primary, ATTAINED attainment', () => {
    expect(getCreditTypeCodeFromAttainment({ primary: true, state: 'ATTAINED' }, true)).toBe(4)
  })

  it('is APPROVED for a passed, primary attainment in any other state', () => {
    expect(getCreditTypeCodeFromAttainment({ primary: true, state: 'INCLUDED' }, true)).toBe(9)
  })
})
